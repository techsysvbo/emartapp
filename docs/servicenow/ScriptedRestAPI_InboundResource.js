/**
 * ServiceNow Scripted REST API Resource: Inbound GitHub Webhook
 * ──────────────────────────────────────────────────────────────
 * This resource receives the GitHub PR payload from the GitHub Actions workflow
 * and creates a Change Request.
 *
 * ─── Setup Instructions ──────────────────────────────────────────────────────
 * 1. Navigate to Scripted REST APIs (System Web Services > Scripted Web Services
 *    > Scripted REST APIs)
 * 2. Create a new API:
 *    Name:       GitHub Integration API
 *    API ID:     github_integration
 *    Base path:  /api/x_github_snow/github_integration
 * 3. Add a Resource:
 *    Name:       Create Change Request
 *    HTTP Method: POST
 *    Relative path: /change_request
 *    Authentication: Basic (or OAuth 2.0 – see note below)
 * 4. Paste the script below into the Script field.
 *
 * Endpoint called by GitHub Actions:
 *   POST https://<instance>.service-now.com/api/x_github_snow/github_integration/change_request
 *
 * Security Note:
 *   - Create a dedicated service account with limited roles (itil or custom).
 *   - Store credentials as GitHub Secrets: SNOW_USERNAME / SNOW_PASSWORD.
 *   - Alternatively, configure an OAuth 2.0 External Client and use bearer tokens.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    try {
        var body = request.body.data;

        // Basic input validation
        var required = ['pr_number', 'repository', 'commit_sha', 'pr_url'];
        for (var i = 0; i < required.length; i++) {
            if (!body[required[i]]) {
                response.setStatus(400);
                response.setBody({ error: 'Missing required field: ' + required[i] });
                return;
            }
        }

        var gh     = new GitHubIntegration();
        var result = gh.createChangeRequest(body);

        if (!result) {
            response.setStatus(500);
            response.setBody({ error: 'Failed to create Change Request' });
            return;
        }

        response.setStatus(201);
        response.setBody({
            result: {
                sys_id: result.sys_id,
                number: result.number,
                message: 'Change Request created successfully'
            }
        });

    } catch (e) {
        gs.error('GitHub Inbound REST API error: ' + e.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal server error: ' + e.message });
    }

})(request, response);
