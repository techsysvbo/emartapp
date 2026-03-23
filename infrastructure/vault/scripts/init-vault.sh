#!/usr/bin/env bash
# =============================================================================
# E-MART – Vault Bootstrap Script
# =============================================================================
# Idempotently initialises the Vault secret paths, policies, and AppRole
# required by the E-MART platform.
#
# Prerequisites:
#   - Vault is running and accessible at VAULT_ADDR
#   - VAULT_TOKEN is set to a root or admin token
#   - The Vault CLI is installed
#
# Usage:
#   export VAULT_ADDR=https://127.0.0.1:8200
#   export VAULT_TOKEN=<your-root-or-admin-token>
#   export VAULT_SKIP_VERIFY=true    # only for self-signed TLS
#   ./infrastructure/vault/scripts/init-vault.sh
#
# To supply actual secret values, copy and edit the placeholder values below
# or pass them as environment variables prefixed with INIT_:
#   INIT_MONGO_URI=mongodb+srv://... ./infrastructure/vault/scripts/init-vault.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICIES_DIR="${SCRIPT_DIR}/../policies"

: "${VAULT_ADDR:?VAULT_ADDR must be set}"
: "${VAULT_TOKEN:?VAULT_TOKEN must be set}"

echo "→ Vault address : ${VAULT_ADDR}"
echo "→ Enabling KV v2 secrets engine at secret/ ..."
vault secrets enable -path=secret kv-v2 2>/dev/null || echo "   (already enabled)"

# ---------------------------------------------------------------------------
# Node.js API secrets
# ---------------------------------------------------------------------------
echo "→ Writing secret/data/emartapp/nodeapi ..."
vault kv put secret/emartapp/nodeapi \
  MONGO_URI="${INIT_MONGO_URI:-mongodb://emongo:27017/epoc}" \
  JWT_SECRET="${INIT_JWT_SECRET:-REPLACE_ME_generate_with_openssl_rand_hex_32}" \
  ADMIN_EMAILS="${INIT_ADMIN_EMAILS:-}" \
  SMTP_ENABLED="${INIT_SMTP_ENABLED:-false}" \
  SMTP_SERVICE="${INIT_SMTP_SERVICE:-gmail}" \
  SMTP_HOST="${INIT_SMTP_HOST:-smtp.gmail.com}" \
  SMTP_USER="${INIT_SMTP_USER:-}" \
  SMTP_PASS="${INIT_SMTP_PASS:-}"

# ---------------------------------------------------------------------------
# Java API secrets
# ---------------------------------------------------------------------------
echo "→ Writing secret/data/emartapp/javaapi ..."
vault kv put secret/emartapp/javaapi \
  MYSQL_URL="${INIT_MYSQL_URL:-jdbc:mysql://emartdb:3306/books?allowPublicKeyRetrieval=true&useSSL=false}" \
  MYSQL_USER="${INIT_MYSQL_USER:-root}" \
  MYSQL_PASSWORD="${INIT_MYSQL_PASSWORD:-REPLACE_ME}"

# ---------------------------------------------------------------------------
# Observability secrets
# ---------------------------------------------------------------------------
echo "→ Writing secret/data/emartapp/observability ..."
vault kv put secret/emartapp/observability \
  GRAFANA_ADMIN_USER="${INIT_GRAFANA_ADMIN_USER:-admin}" \
  GRAFANA_ADMIN_PASSWORD="${INIT_GRAFANA_ADMIN_PASSWORD:-REPLACE_ME}"

# ---------------------------------------------------------------------------
# Policy
# ---------------------------------------------------------------------------
echo "→ Applying emartapp-policy ..."
vault policy write emartapp-policy "${POLICIES_DIR}/emartapp-policy.hcl"

# ---------------------------------------------------------------------------
# AppRole authentication (for non-dev automated access)
# ---------------------------------------------------------------------------
echo "→ Enabling AppRole auth method ..."
vault auth enable approle 2>/dev/null || echo "   (already enabled)"

echo "→ Creating AppRole 'emartapp' ..."
vault write auth/approle/role/emartapp \
  token_policies="emartapp-policy" \
  token_ttl="1h" \
  token_max_ttl="4h" \
  secret_id_ttl="24h" \
  secret_id_num_uses=0

ROLE_ID=$(vault read -field=role_id auth/approle/role/emartapp/role-id)
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "  Vault bootstrap complete."
echo "  AppRole Role ID: ${ROLE_ID}"
echo ""
echo "  To generate a Secret ID (for scripts/vault-sync.sh):"
echo "    vault write -f auth/approle/role/emartapp/secret-id"
echo "╚══════════════════════════════════════════════════════════╝"
