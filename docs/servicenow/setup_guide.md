# ServiceNow Configuration Guide – GitHub Integration

This guide walks a ServiceNow administrator through all the configuration steps
required to complete the GitHub ↔ ServiceNow integration.

---

## Table of Contents
1. [Custom Fields on change_request](#1-custom-fields-on-change_request)
2. [System Properties](#2-system-properties)
3. [Script Include](#3-script-include)
4. [Scripted REST API (Inbound)](#4-scripted-rest-api-inbound)
5. [Business Rule (Outbound Callback)](#5-business-rule-outbound-callback)
6. [Approver Group & Assignment](#6-approver-group--assignment)
7. [Email Notifications](#7-email-notifications)
8. [Access Control & Service Account](#8-access-control--service-account)

---

## 1. Custom Fields on `change_request`

Navigate to **System Definition > Dictionary** and add the following fields to
the `change_request` table:

| Column label              | Column name               | Type         | Max length |
|---------------------------|---------------------------|--------------|------------|
| GitHub PR Number          | `u_github_pr_number`      | String       | 20         |
| GitHub Repository         | `u_github_repo`           | String       | 255        |
| GitHub PR URL             | `u_github_pr_url`         | URL          | 1024       |
| GitHub Commit SHA         | `u_github_commit_sha`     | String       | 64         |
| GitHub Source Branch      | `u_github_source_branch`  | String       | 255        |
| GitHub Target Branch      | `u_github_target_branch`  | String       | 255        |

> After adding fields, add them to the **Change Request form view** and the
> **Change Request list view** for visibility.

---

## 2. System Properties

Navigate to **System Properties > All Properties** and create:

| Property name                          | Value                          | Description                             |
|----------------------------------------|--------------------------------|-----------------------------------------|
| `x_github_snow.github_token`           | `github_pat_xxx…` (Fine-grained PAT) | GitHub Fine-grained Personal Access Token with minimal permissions: Contents (Read), Pull requests (Write), Commit statuses (Write) – used for `repository_dispatch` + PR comments |
| `x_github_snow.approver_group_sys_id`  | `<sys_id of approver group>`   | sys_id of the assignment group (e.g., CCoE + Government POC) |

> **Security**: Mark `x_github_snow.github_token` as **Private** so it is
> encrypted in the database and not visible to non-admin users.

---

## 3. Script Include

1. Navigate to **System Definition > Script Includes**.
2. Create a new Script Include:
   - **Name**: `GitHubIntegration`
   - **API Name**: `global.GitHubIntegration`
   - **Client callable**: `false`
   - **Active**: `true`
3. Paste the content of `GitHubIntegration_ScriptInclude.js` into the **Script** field.
4. **Save**.

---

## 4. Scripted REST API (Inbound)

### 4a. Create the API

1. Navigate to **System Web Services > Scripted Web Services > Scripted REST APIs**.
2. Click **New**:
   - **Name**: `GitHub Integration API`
   - **API ID**: `github_integration`
   - **Base path**: `/api/x_github_snow/github_integration`
3. **Save**.

### 4b. Add a Resource

1. On the API record, scroll to **Resources** and click **New**:
   - **Name**: `Create Change Request`
   - **HTTP Method**: `POST`
   - **Relative path**: `/change_request`
   - **Authentication**: `Requires authentication` → Basic Auth
2. Paste the content of `ScriptedRestAPI_InboundResource.js` into the **Script** field.
3. **Save**.

### 4c. Test the endpoint

```bash
curl -u <snow_user>:<snow_password> \
  -X POST \
  -H "Content-Type: application/json" \
  "https://<instance>.service-now.com/api/x_github_snow/github_integration/change_request" \
  -d '{
    "pr_number": "1",
    "repository": "techsysvbo/emartapp",
    "source_branch": "feature/test",
    "target_branch": "main",
    "pr_url": "https://github.com/techsysvbo/emartapp/pull/1",
    "commit_sha": "abc123",
    "pr_title": "Test PR",
    "github_approvers": ["octocat"],
    "short_description": "GitHub PR #1 – Test PR",
    "description": "Test change request"
  }'
```

Expected response: HTTP `201` with `{ "result": { "sys_id": "...", "number": "CHG0012345" } }`

---

## 5. Business Rule (Outbound Callback)

1. Navigate to **System Definition > Business Rules**.
2. Click **New**:
   - **Name**: `GitHub Approval Callback`
   - **Table**: `Change Request [change_request]`
   - **When**: `after`
   - **Advanced**: ✅ checked
3. Set **Condition** (using condition builder or script):
   ```
   current.u_github_pr_number != '' && (current.state.changesTo('3') || current.state.changesTo('-4'))
   ```
4. Paste the content of `BusinessRule_GitHubApprovalCallback.js` into the **Script** field.
5. **Save**.

> **State codes** (verify these match your SNOW instance):
> - `3` = Closed / Implement
> - `-4` = Cancelled
> Adjust if your instance uses different codes.

---

## 6. Approver Group & Assignment

1. Navigate to **User Administration > Groups** and locate (or create) your
   approver group (e.g., `CCoE Production Approvers`).
2. Copy the group's **sys_id** (right-click the record header → Copy sys_id).
3. Set `x_github_snow.approver_group_sys_id` to this value.
4. Ensure all approvers are members of this group.
5. Configure **Change Approval Policy** on the group if using the CAB workflow.

---

## 7. Email Notifications

Navigate to **System Notification > Email > Notifications** and create:

### 7a. Change Request Created (to Approvers)
- **Name**: Change Request Created – GitHub Integration
- **Table**: `Change Request [change_request]`
- **When to send** → **Inserted**
- **Filter conditions**: `GitHub PR Number is not empty`
- **Who will receive**: `Assignment group members`
- **Email subject**: `[${number}] Production Change Request: ${short_description}`
- **Email body** (HTML):
  ```
  A new Change Request has been created from a GitHub Pull Request.

  Change Request: ${number}
  PR URL: ${u_github_pr_url}
  Repository: ${u_github_repo}
  Source → Target: ${u_github_source_branch} → ${u_github_target_branch}
  Commit: ${u_github_commit_sha}

  Please review and approve or reject in ServiceNow:
  https://<instance>.service-now.com/nav_to.do?uri=change_request.do?sys_id=${sys_id}
  ```

### 7b. Decision Notification (to Requester)
- **Name**: Change Request Decision – GitHub Integration
- **Table**: `Change Request [change_request]`
- **When to send** → **Updated** → `state changes to Closed`
- **Filter conditions**: `GitHub PR Number is not empty`
- **Who will receive**: `Opened by`

---

## 8. Access Control & Service Account

### Service Account for GitHub Actions (inbound calls)

1. Create a ServiceNow user: `svc_github_integration`
2. Assign roles:
   - `itil` – or a custom role with:
     - Read/write access to `change_request` table
     - Execute access to the Scripted REST API endpoint
3. Store credentials as GitHub repository secrets:
   - `SNOW_INSTANCE` – e.g., `dev12345`
   - `SNOW_USERNAME` – `svc_github_integration`
   - `SNOW_PASSWORD` – service account password

### GitHub PAT for ServiceNow (outbound callbacks)

1. In GitHub, create a **Fine-grained Personal Access Token**:
   - Repo access: `techsysvbo/emartapp`
   - Permissions:
     - `Contents: Read` (for `repository_dispatch`)
     - `Pull requests: Write` (for comments)
     - `Commit statuses: Write`
2. Store as `x_github_snow.github_token` System Property in ServiceNow
   (marked Private).

---

## Verification Checklist

- [ ] All custom fields exist on `change_request` table
- [ ] System properties set (github_token, approver_group_sys_id)
- [ ] Script Include `GitHubIntegration` is active
- [ ] Scripted REST API endpoint returns HTTP 201 on test POST
- [ ] Business Rule fires on state change (test by manually updating a CR state)
- [ ] Approver group has members and email notifications configured
- [ ] GitHub repository secrets configured (SNOW_INSTANCE, SNOW_USERNAME, SNOW_PASSWORD)
- [ ] GitHub branch protection rules configured (see main integration guide)
