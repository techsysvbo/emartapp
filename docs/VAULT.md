# E-MART – Vault Integration Guide

## Why Vault

HashiCorp Vault is used as the single source of truth for all sensitive configuration:
- Database connection strings and credentials
- JWT signing secrets
- SMTP credentials
- Observability tool admin passwords

**Local Vault instance**: `https://127.0.0.1:8200` (UI at `/ui/vault/dashboard`)

---

## Secret Paths

All E-MART secrets are stored under the `secret/` KV v2 engine:

| Path | Contents |
|------|----------|
| `secret/emartapp/nodeapi` | MONGO_URI, JWT_SECRET, SMTP_*, ADMIN_EMAILS |
| `secret/emartapp/javaapi` | MYSQL_URL, MYSQL_USER, MYSQL_PASSWORD |
| `secret/emartapp/observability` | GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD |

---

## Authentication

### Development – Token Auth

Suitable only for bootstrapping and local development on a trusted machine.

```bash
export VAULT_TOKEN=<root-or-admin-token>
vault kv get secret/emartapp/nodeapi
```

### Automation – AppRole Auth (recommended)

AppRole is the recommended method for CI/CD pipelines, deployment scripts, and containers.

```bash
# Authenticate and retrieve a token
vault write -field=token auth/approle/login \
  role_id=<role-id> \
  secret_id=<secret-id>
```

The `scripts/vault-sync.sh` script handles this automatically when `VAULT_ROLE_ID` and `VAULT_SECRET_ID` are set.

---

## Bootstrap

Run once to set up Vault for the E-MART platform:

```bash
export VAULT_ADDR=https://127.0.0.1:8200
export VAULT_TOKEN=<root-token>
export VAULT_SKIP_VERIFY=true   # only if using a self-signed certificate

# Optionally pre-set secret values:
export INIT_JWT_SECRET=$(openssl rand -hex 32)
export INIT_MYSQL_PASSWORD=your-db-password
export INIT_GRAFANA_ADMIN_PASSWORD=your-grafana-password

./infrastructure/vault/scripts/init-vault.sh
```

---

## Daily Developer Workflow

```bash
# Fetch latest secrets from Vault and write to .env (mode 600)
VAULT_ROLE_ID=<id> VAULT_SECRET_ID=<id> ./scripts/vault-sync.sh

# .env is now populated – start Docker Compose normally
docker compose up
```

---

## Vault Policy

The least-privilege policy for E-MART is defined at:

```
infrastructure/vault/policies/emartapp-policy.hcl
```

It grants **read** access to the three secret paths above and allows token self-renewal. It does not allow listing, creating, or deleting secrets.

---

## Phase 2: Vault Agent

In Phase 2, Vault Agent will replace the sync-script pattern:

1. **Docker Compose**: A Vault Agent container will mount secrets into a shared volume read by the application containers (no env vars needed).
2. **Kubernetes**: The Vault Agent Injector (webhook) will inject secrets as files into pod volumes.

This enables automatic rotation without container restarts.

---

## Rotating Secrets

```bash
# Update a secret in Vault
vault kv patch secret/emartapp/nodeapi JWT_SECRET=$(openssl rand -hex 32)

# Re-sync .env and restart the affected container
VAULT_ROLE_ID=<id> VAULT_SECRET_ID=<id> ./scripts/vault-sync.sh
docker compose up -d --no-deps api
```

---

## Security Notes

- Never store `VAULT_TOKEN` in `.env` committed to Git.
- Rotate the AppRole Secret ID regularly: `vault write -f auth/approle/role/emartapp/secret-id`.
- Use `VAULT_SKIP_VERIFY=false` in all non-dev environments; install the CA certificate instead.
- The `.vault-token` file created by the CLI is gitignored.
