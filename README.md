# E-MART – Enterprise-Grade E-Commerce Platform

A polyglot e-commerce application modernised for secure, production-ready containerised deployment.

## Architecture

Three independently deployable services behind a shared Nginx reverse proxy:

| Service | Technology | Responsibility |
|---------|-----------|----------------|
| **client** | Angular 9, Nginx | SPA frontend |
| **api** | Node.js 18, Express | User auth, shop, products, orders → MongoDB |
| **webapi** | Spring Boot / Java 17 | Books catalogue → MySQL |
| **nginx** | Nginx 1.25 | Reverse proxy (`:80`) |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture, phased roadmap, and tooling decisions.

---

## Quick Start

### Requirements
- Docker 24+ and Docker Compose 2.20+
- (Optional) Vault CLI for secret management

### 1. Configure secrets

```bash
cp .env.example .env
# Edit .env – set JWT_SECRET, MYSQL_PASSWORD, etc.
# Or use Vault: ./scripts/vault-sync.sh  (see docs/VAULT.md)
```

### 2. Start the application

```bash
docker compose up --build
```

Open **http://localhost** in your browser.

### 3. (Optional) Start with observability

```bash
docker compose --profile observability up --build
# Grafana: http://localhost:3000
# Prometheus: http://localhost:9090
```

Full developer guide: [docs/LOCAL_DEV.md](docs/LOCAL_DEV.md)

---

## Security

- All secrets are managed via HashiCorp Vault or `.env` (never hardcoded)
- Admin roles controlled via `ADMIN_EMAILS` environment variable
- Non-root containers with pinned base images
- Trivy image scanning on every CI run
- SonarQube static analysis

See [docs/VAULT.md](docs/VAULT.md) for Vault setup instructions.

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger |
|----------|---------|
| `ci.yml` | All pushes and PRs – build, test, Trivy scan |
| `cd.yml` | Push to `main` – build, push images to GHCR, deploy |
| `sonarqube.yml` | Push to `main`/`develop`, PRs – SonarQube analysis |

---

## Infrastructure

```
infrastructure/
├── vault/              # Vault policies and bootstrap scripts
├── terraform/          # MongoDB Atlas + IaC modules
├── observability/      # Prometheus, Grafana, Loki, Promtail configs
└── ansible/            # (Phase 2) Configuration management
```

---

## Documentation

- [Architecture & Roadmap](docs/ARCHITECTURE.md)
- [Local Development Guide](docs/LOCAL_DEV.md)
- [Vault Integration](docs/VAULT.md)
- [Operations Runbook](docs/RUNBOOK.md)
