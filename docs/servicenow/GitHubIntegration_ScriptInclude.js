/**
 * ServiceNow Script Include: GitHubIntegration
 * ─────────────────────────────────────────────
 * Handles inbound GitHub Pull Request payloads and creates Change Requests.
 * Also provides helper methods for calling back to the GitHub API.
 *
 * Usage (from a Scripted REST API resource or Business Rule):
 *   var gh = new GitHubIntegration();
 *   var result = gh.createChangeRequest(requestBody);
 */
var GitHubIntegration = Class.create();
GitHubIntegration.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /**
     * Creates a Change Request from a GitHub PR payload.
     *
     * Expected payload fields:
     *   pr_number, repository, source_branch, target_branch,
     *   pr_url, commit_sha, pr_title, github_approvers[], description
     *
     * @param  {Object} payload  Parsed JSON from GitHub Actions
     * @return {Object}          { sys_id, number } of the created CR
     */
    createChangeRequest: function(payload) {
        var gr = new GlideRecord('change_request');
        gr.initialize();

        // Core fields
        gr.setValue('short_description', payload.short_description ||
            'GitHub PR #' + payload.pr_number + ' – ' + payload.pr_title);
        gr.setValue('description', payload.description);
        gr.setValue('type', 'normal');          // normal | standard | emergency
        gr.setValue('category', 'Software');
        gr.setValue('priority', '3');           // Moderate
        gr.setValue('risk', '2');               // Medium
        gr.setValue('impact', '2');             // Medium

        // State: -1 = Draft, 1 = Open (Assess), 2 = Authorize, 3 = Scheduled
        gr.setValue('state', '-1');             // Start as Draft

        // Custom fields – add u_ prefix fields to your change_request table
        gr.setValue('u_github_pr_number',  payload.pr_number   || '');
        gr.setValue('u_github_repo',       payload.repository  || '');
        gr.setValue('u_github_pr_url',     payload.pr_url      || '');
        gr.setValue('u_github_commit_sha', payload.commit_sha  || '');
        gr.setValue('u_github_source_branch', payload.source_branch || '');
        gr.setValue('u_github_target_branch', payload.target_branch || '');

        // Approver group assignment (configure your assignment group sys_id)
        var approverGroupSysId = gs.getProperty('x_github_snow.approver_group_sys_id', '');
        if (approverGroupSysId) {
            gr.setValue('assignment_group', approverGroupSysId);
        }

        // Work notes – full audit trail
        var workNote = 'GitHub Integration Metadata\n' +
            '─────────────────────────────\n' +
            'Repository:    ' + payload.repository    + '\n' +
            'PR Number:     ' + payload.pr_number     + '\n' +
            'PR URL:        ' + payload.pr_url        + '\n' +
            'Commit SHA:    ' + payload.commit_sha    + '\n' +
            'Source Branch: ' + payload.source_branch + '\n' +
            'Target Branch: ' + payload.target_branch + '\n' +
            'Approved by:   ' + (payload.github_approvers || []).join(', ');
        gr.setValue('work_notes', workNote);

        var sysId = gr.insert();

        if (!sysId) {
            gs.error('GitHubIntegration.createChangeRequest: Failed to insert Change Request');
            return null;
        }

        gs.info('GitHubIntegration: Created Change Request ' + gr.getValue('number') +
            ' for PR #' + payload.pr_number + ' in ' + payload.repository);

        return {
            sys_id: sysId,
            number: gr.getValue('number')
        };
    },

    /**
     * Sends the approval decision back to GitHub via the repository_dispatch API.
     * Must be called after the Change Request is approved or rejected in ServiceNow.
     *
     * @param {GlideRecord} changeGr  The change_request GlideRecord
     * @param {String}      decision  'approved' | 'rejected'
     * @param {String}      reason    Human-readable reason / approval notes
     */
    notifyGitHub: function(changeGr, decision, reason) {
        var prNumber  = changeGr.getValue('u_github_pr_number');
        var sha       = changeGr.getValue('u_github_commit_sha');
        var repo      = changeGr.getValue('u_github_repo');       // e.g. "org/repo"
        var crNumber  = changeGr.getValue('number');
        var sysId     = changeGr.getValue('sys_id');

        if (!prNumber || !sha || !repo) {
            gs.warn('GitHubIntegration.notifyGitHub: Missing GitHub metadata on CR ' + crNumber +
                '. Skipping callback.');
            return false;
        }

        var githubToken = gs.getProperty('x_github_snow.github_token', '');
        if (!githubToken) {
            gs.error('GitHubIntegration.notifyGitHub: x_github_snow.github_token not set.');
            return false;
        }

        var payload = {
            event_type: 'snow-approval-decision',
            client_payload: {
                pr_number:             prNumber,
                sha:                   sha,
                decision:              decision,
                reason:                reason || '',
                change_request_number: crNumber,
                change_request_sys_id: sysId
            }
        };

        var rm = new sn_ws.RESTMessageV2();
        rm.setEndpoint('https://api.github.com/repos/' + repo + '/dispatches');
        rm.setHttpMethod('POST');
        rm.setRequestHeader('Accept', 'application/vnd.github+json');
        rm.setRequestHeader('Authorization', 'Bearer ' + githubToken);
        rm.setRequestHeader('X-GitHub-Api-Version', '2022-11-28');
        rm.setRequestHeader('Content-Type', 'application/json');
        rm.setRequestBody(JSON.stringify(payload));

        var response = rm.execute();
        var statusCode = response.getStatusCode();

        if (statusCode !== 204) {
            gs.error('GitHubIntegration.notifyGitHub: GitHub API returned ' + statusCode +
                ' – ' + response.getBody());
            return false;
        }

        gs.info('GitHubIntegration: Notified GitHub repo ' + repo +
            ' with decision=' + decision + ' for PR #' + prNumber);
        return true;
    },

    /**
     * Posts a comment to the GitHub Pull Request.
     *
     * @param {GlideRecord} changeGr  The change_request GlideRecord
     * @param {String}      comment   Markdown comment body
     */
    postGitHubComment: function(changeGr, comment) {
        var repo      = changeGr.getValue('u_github_repo');
        var prNumber  = changeGr.getValue('u_github_pr_number');
        var githubToken = gs.getProperty('x_github_snow.github_token', '');

        if (!repo || !prNumber || !githubToken) {
            gs.warn('GitHubIntegration.postGitHubComment: Missing required fields. Skipping.');
            return false;
        }

        var rm = new sn_ws.RESTMessageV2();
        rm.setEndpoint('https://api.github.com/repos/' + repo + '/issues/' + prNumber + '/comments');
        rm.setHttpMethod('POST');
        rm.setRequestHeader('Accept', 'application/vnd.github+json');
        rm.setRequestHeader('Authorization', 'Bearer ' + githubToken);
        rm.setRequestHeader('X-GitHub-Api-Version', '2022-11-28');
        rm.setRequestHeader('Content-Type', 'application/json');
        rm.setRequestBody(JSON.stringify({ body: comment }));

        var response = rm.execute();
        var statusCode = response.getStatusCode();

        if (statusCode !== 201) {
            gs.error('GitHubIntegration.postGitHubComment: GitHub API returned ' + statusCode);
            return false;
        }
        return true;
    },

    type: 'GitHubIntegration'
});
