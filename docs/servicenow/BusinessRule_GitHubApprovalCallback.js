/**
 * ServiceNow Business Rule: GitHub Approval Callback
 * ────────────────────────────────────────────────────
 * Table:     change_request
 * When:      After update
 * Condition: current.state.changesTo(3) || current.state.changesTo(4)
 *            (3 = Closed / Implement, 4 = Review)
 *            AND current.u_github_pr_number != ''
 *
 * Fires when a Change Request that originated from GitHub is moved to
 * an approved/closed state or rejected, then notifies GitHub.
 *
 * ─── How to configure this Business Rule ────────────────────────────────────
 * 1. Navigate to System Definition > Business Rules
 * 2. New record:
 *    Name:      GitHub Approval Callback
 *    Table:     Change Request [change_request]
 *    When:      after
 *    Advanced:  checked (use script below)
 *    Condition: current.u_github_pr_number != '' &&
 *               (current.state.changesTo('3') || current.state.changesTo('-4'))
 *               (-4 = Closed/Cancelled in some SNOW versions – adjust to your instance)
 * 3. Paste script into the Script field.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function executeRule(current, previous) {

    var gh = new GitHubIntegration();

    // Determine decision based on final state and close code
    var state     = current.state.toString();
    var closeCode = current.close_code.toString().toLowerCase();
    var closeNotes = current.close_notes.toString() || current.work_notes.toString();

    var decision;
    var reason;

    if (state === '3') {   // Closed
        if (closeCode === 'successful' || closeCode === 'implemented') {
            decision = 'approved';
            reason   = closeNotes || 'Change Request approved and implemented.';
        } else if (closeCode === 'unsuccessful' || closeCode === 'not_implemented') {
            decision = 'rejected';
            reason   = closeNotes || 'Change Request closed as unsuccessful.';
        } else {
            // Generic closed – treat as approved for standard change flow
            decision = 'approved';
            reason   = closeNotes || 'Change Request closed.';
        }
    } else if (state === '-4' || state === '7') {   // Cancelled
        decision = 'rejected';
        reason   = closeNotes || 'Change Request cancelled.';
    } else {
        // Not a terminal state – do nothing
        return;
    }

    // Call back GitHub with the decision
    var success = gh.notifyGitHub(current, decision, reason);

    if (success) {
        // Also post a PR comment for visibility
        var comment;
        if (decision === 'approved') {
            comment = '## ✅ Approved for Production Deployment\n\n' +
                '**Change Request:** `' + current.number + '`\n\n' +
                '**Approval Notes:** ' + reason + '\n\n' +
                '_Notification sent by ServiceNow. The `snow-approval-status` check is now passing._';
        } else {
            comment = '## ❌ Production Deployment Rejected\n\n' +
                '**Change Request:** `' + current.number + '`\n\n' +
                '**Rejection Reason:** ' + reason + '\n\n' +
                '_Merge to `main` is blocked. Please address the concerns and open a new Change Request._';
        }
        gh.postGitHubComment(current, comment);
    }

})(current, previous);
