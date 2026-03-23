# ---------------------------------------------------------------------------
# E-MART – Vault Least-Privilege Policy
# ---------------------------------------------------------------------------
# This policy grants the emartapp service identity (AppRole) read-only
# access to the secrets it needs. It can read its own secrets and renew
# its own token. It cannot list, create, or delete secrets.
#
# Apply with:
#   vault policy write emartapp-policy infrastructure/vault/policies/emartapp-policy.hcl
# ---------------------------------------------------------------------------

# Node.js API secrets
path "secret/data/emartapp/nodeapi" {
  capabilities = ["read"]
}

# Java API secrets
path "secret/data/emartapp/javaapi" {
  capabilities = ["read"]
}

# Shared secrets (e.g., SMTP credentials)
path "secret/data/emartapp/shared" {
  capabilities = ["read"]
}

# Allow token self-renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Allow AppRole secret ID lookup (needed for Vault Agent)
path "auth/approle/role/emartapp/secret-id" {
  capabilities = ["create", "update"]
}
