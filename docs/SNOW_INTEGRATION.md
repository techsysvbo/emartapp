# GitHub ↔ ServiceNow Integration

End-to-end integration enforcing ServiceNow-governed production change approvals
before any code is merged to `main`.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  GitHub                                                              │
│                                                                      │
│  Developer ──► Feature Branch ──► Pull Request (to main)            │
│                                         │                            │
│                                    [pr-ci.yml]                       │
│                                    Tests / Lint / CodeQL             │
│                                         │                            │
│                               SME Review & Approve                   │
│                                         │                            │
│                             [snow-create-change.yml]                 │
│                             POST ──────────────────────────────────► │
└─────────────────────────────────────────────────────────────────────►│
                                                                       │
┌──────────────────────────────────────────────────────────────────────┤
│  ServiceNow                                                          │
│                                                                      │
│  Scripted REST API ◄── GitHub Actions POST                           │
│         │                                                            │
│  Creates Change Request                                              │
│         │                                                            │
│  Assigns to Approver Group (CCoE + Government POC)                   │
│         │                                                            │
│  Approvers review → Approve or Reject                                │
│         │                                                            │
│  Business Rule fires ──────────────────────────────────────────────► │
└─────────────────────────────────────────────────────────────────────►│
                                                                       │
┌──────────────────────────────────────────────────────────────────────┤
│  GitHub (callback)                                                   │
│                                                                      │
│  [snow-approval-callback.yml]                                        │
│  repository_dispatch: snow-approval-decision                         │
│         │                                                            │
│  Updates commit status: snow-approval-status = success | failure     │
│  Posts PR comment with outcome                                       │
│         │                                                            │
│  If approved → Developer merges PR                                   │
│         │                                                            │
│  [deploy-production.yml]                                             │
│  Build → Push images → Helm upgrade → Notify ServiceNow (CR closed) │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Workflow Steps

### 1. PR Creation & CI Validation

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `pr-ci.yml` | `pull_request` → `main` | validate-node, validate-angular, validate-java, codeql (JS + Java) |

All jobs must pass. Their GitHub status checks are automatically required by
the branch protection rules.

### 2. SME Review & Approval in GitHub

A developer's peers review the PR inside GitHub. Once any reviewer approves,
the next workflow fires.

### 3. ServiceNow Change Request Creation

| Workflow | Trigger | Action |
|----------|---------|--------|
| `snow-create-change.yml` | `pull_request_review` (state=approved, base=main) | Sets `snow-approval-status=pending`; POSTs PR metadata to ServiceNow; posts PR comment with CR number |

**Payload sent to ServiceNow:**
```json
{
  "pr_number": "42",
  "repository": "techsysvbo/emartapp",
  "source_branch": "feature/my-feature",
  "target_branch": "main",
  "pr_url": "https://github.com/techsysvbo/emartapp/pull/42",
  "commit_sha": "abc123def456",
  "pr_title": "Add feature X",
  "github_approvers": ["alice"],
  "short_description": "GitHub PR #42 – Add feature X",
  "description": "..."
}
```

### 4. ServiceNow Approval Workflow

ServiceNow:
1. Creates `change_request` with all GitHub metadata stored in custom fields
2. Assigns to the configured approver group
3. Sends email notifications to approvers
4. Awaits approval decision

### 5. Approval Callback to GitHub

When a ServiceNow approver closes the Change Request:

| Workflow | Trigger | Action |
|----------|---------|--------|
| `snow-approval-callback.yml` | `repository_dispatch: snow-approval-decision` | Updates `snow-approval-status` check; posts outcome comment to PR |

**ServiceNow calls GitHub via:**
```
POST https://api.github.com/repos/techsysvbo/emartapp/dispatches
{
  "event_type": "snow-approval-decision",
  "client_payload": {
    "pr_number": "42",
    "sha": "abc123def456",
    "decision": "approved",
    "reason": "Approved by CCoE",
    "change_request_number": "CHG0012345",
    "change_request_sys_id": "<sys_id>"
  }
}
```

### 6. Merge & Production Deployment

Once `snow-approval-status = success`:
- Branch protection rules allow the merge button to be clicked
- Developer merges the PR
- `deploy-production.yml` triggers automatically:
  1. Builds and pushes Docker images (Angular client, Node.js API, Java API)
  2. Performs Helm upgrade on the Kubernetes cluster
  3. Notifies ServiceNow to close the Change Request

---

## Required GitHub Repository Secrets

| Secret | Description |
|--------|-------------|
| `GH_TOKEN` | GitHub PAT with `repo` scope (statuses:write, pull-requests:write, contents:write) |
| `SNOW_INSTANCE` | ServiceNow instance subdomain (e.g., `dev12345`) |
| `SNOW_USERNAME` | ServiceNow service account username |
| `SNOW_PASSWORD` | ServiceNow service account password |
| `REGISTRY_URL` | Container registry host (e.g., `repository.k8sengineers.com`) |
| `REGISTRY_USERNAME` | Registry username |
| `REGISTRY_PASSWORD` | Registry password |
| `KUBE_CONFIG` | Base64-encoded kubeconfig for production cluster |

---

## Required GitHub Branch Protection Rules (main)

Navigate to **Settings → Branches → Add branch protection rule** for `main`:

| Setting | Value |
|---------|-------|
| Require a pull request before merging | ✅ |
| Required approvals | 1 (minimum) |
| Require status checks to pass before merging | ✅ |
| **Required status checks** | `snow-approval-status` |
| | `Validate Node.js API` |
| | `Validate Angular Client` |
| | `Validate Java API` |
| | `CodeQL Security Scan (javascript)` |
| | `CodeQL Security Scan (java)` |
| Require branches to be up to date | ✅ |
| Do not allow bypassing the above settings | ✅ |
| Restrict who can push to matching branches | ✅ (admins only) |

> **Critical**: `snow-approval-status` is the key enforcement check.
> It is set to `pending` by `snow-create-change.yml` immediately on PR approval
> and only becomes `success` after ServiceNow approves the Change Request.

---

## ServiceNow Configuration

See [`docs/servicenow/setup_guide.md`](servicenow/setup_guide.md) for the full
ServiceNow administrator setup guide, including:

- Custom fields on `change_request`
- System Properties
- Script Include (`GitHubIntegration`)
- Scripted REST API (inbound webhook)
- Business Rule (outbound callback)
- Approver group & email notifications
- Service account & access control

---

## File Reference

| File | Purpose |
|------|---------|
| `.github/workflows/pr-ci.yml` | PR validation – tests, linting, CodeQL |
| `.github/workflows/snow-create-change.yml` | On GitHub approval: set status=pending, create SNOW CR |
| `.github/workflows/snow-approval-callback.yml` | On SNOW decision: update commit status, comment on PR |
| `.github/workflows/deploy-production.yml` | On merge to main: build, push, Helm deploy, close CR |
| `docs/servicenow/GitHubIntegration_ScriptInclude.js` | ServiceNow Script Include |
| `docs/servicenow/BusinessRule_GitHubApprovalCallback.js` | ServiceNow Business Rule |
| `docs/servicenow/ScriptedRestAPI_InboundResource.js` | ServiceNow Scripted REST API resource |
| `docs/servicenow/setup_guide.md` | Full ServiceNow admin setup guide |

---

## Emergency Change Flow

For P1/emergency situations where the standard approval SLA cannot be met:

1. Developer sets label `emergency-change` on the PR
2. Modify `snow-create-change.yml` to detect this label and set
   `"type": "emergency"` in the ServiceNow payload
3. ServiceNow routes emergency CRs to an expedited approver group with a
   reduced SLA (e.g., 1 hour vs. 48 hours for normal CRs)
4. All other checks remain enforced

---

## Audit & Compliance

Every production change is fully auditable:
- **GitHub**: PR history, review records, status check timeline, workflow run logs
- **ServiceNow**: Change Request with full PR metadata, approval history, work notes,
  deployment outcome
- The PR ↔ CR linkage is stored in both systems:
  - GitHub PR comment references the CR number and ServiceNow URL
  - ServiceNow CR stores PR URL, commit SHA, repository, and approvers
