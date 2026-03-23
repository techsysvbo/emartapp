# E-MART – Local Development Guide

## Prerequisites

| Tool | Min Version | Install |
|------|------------|---------|
| Docker | 24+ | https://docs.docker.com/get-docker/ |
| Docker Compose | 2.20+ | bundled with Docker Desktop |
| Vault CLI | 1.15+ | https://developer.hashicorp.com/vault/install |
| Node.js | 18+ | https://nodejs.org/ |
| Java JDK | 17+ | https://adoptium.net/ |

---

## Option A – Quick Start (manual .env)

Fastest path for local dev without a running Vault:

```bash
# 1. Clone and enter the repository
git clone https://github.com/techsysvbo/emartapp.git
cd emartapp

# 2. Create .env from the template
cp .env.example .env

# 3. Fill in the required values in .env:
#    JWT_SECRET=<openssl rand -hex 32>
#    MYSQL_PASSWORD=<choose a strong password>
#    GRAFANA_ADMIN_PASSWORD=<choose a password>
#    Leave SMTP_ENABLED=false for local dev

# 4. Start the application stack
docker compose up --build

# 5. (Optional) Start with observability
docker compose --profile observability up --build
```

Open http://localhost in your browser.

---

## Option B – Vault-backed .env (recommended)

Vault is running at https://127.0.0.1:8200 (local instance).

### One-time Vault setup

```bash
# 1. Bootstrap secrets and AppRole into Vault
export VAULT_ADDR=https://127.0.0.1:8200
export VAULT_TOKEN=<your-root-token>
export VAULT_SKIP_VERIFY=true          # only if using self-signed TLS

# Supply real secret values as env vars prefixed with INIT_:
INIT_JWT_SECRET=$(openssl rand -hex 32) \
INIT_MYSQL_PASSWORD=mysecurepassword \
INIT_GRAFANA_ADMIN_PASSWORD=mygrafanapass \
./infrastructure/vault/scripts/init-vault.sh
```

The script prints the AppRole **Role ID**. Generate a Secret ID:

```bash
vault write -f auth/approle/role/emartapp/secret-id
```

Save both values—they are the credentials your local machine uses.

### Daily workflow

```bash
# Sync secrets from Vault into .env
VAULT_ROLE_ID=<role-id> \
VAULT_SECRET_ID=<secret-id> \
./scripts/vault-sync.sh

# Start everything
docker compose --profile observability up
```

---

## Service URLs

| Service | URL |
|---------|-----|
| E-MART app | http://localhost |
| Node API (direct) | http://localhost:5000 |
| Books API (direct) | http://localhost:9000/webapi/books |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |
| Loki | http://localhost:3100 |

---

## Running individual services for development

```bash
# Node.js API with live reload
cd nodeapi
cp ../.env .env          # or export vars individually
npm install
npm run server           # nodemon

# Angular frontend dev server
cd client
npm install
npx ng serve             # http://localhost:4200

# Spring Boot API
cd javaapi
export MYSQL_PASSWORD=<password>
./mvnw spring-boot:run
```

---

## Stopping and cleaning up

```bash
# Stop containers
docker compose down

# Stop and remove volumes (destroys data)
docker compose down -v
```

---

## Troubleshooting

### `MYSQL_PASSWORD` not set
Ensure `.env` is populated. Run `docker compose config` to verify env var expansion.

### MongoDB connection refused
For local dev the `emongo` container must be healthy before the `api` container starts.
Check: `docker compose ps` and `docker compose logs emongo`.

### JWT_SECRET undefined
The Node API will silently fail to sign tokens if `JWT_SECRET` is empty.
Always set a non-empty value in `.env`.

### Port conflicts
Override ports in `.env` without editing `docker-compose.yaml`:
```
NGINX_PORT=8080
API_PORT=5001
WEBAPI_PORT=9001
```
