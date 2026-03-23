# E-MART – Architecture Overview

## Current State (Phase 1)

E-MART is a polyglot e-commerce platform composed of three independently deployable services behind a shared Nginx reverse proxy.

```
┌──────────────────────────────────────────────────────────────────┐
│                       Browser / Client                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP :80
                    ┌────────▼────────┐
                    │  Nginx (proxy)  │
                    └──┬────────┬─────┘
              /        │        │  /api         /webapi
         ┌───▼──┐  ┌───▼───┐  ┌──▼──────┐
         │Client│  │nodeapi│  │ javaapi │
         │:4200 │  │:5000  │  │ :9000   │
         │Nginx │  │Node.js│  │SpringBt │
         └──────┘  └───┬───┘  └────┬────┘
                       │           │
                  ┌────▼───┐  ┌────▼───┐
                  │MongoDB │  │ MySQL  │
                  │:27017  │  │ :3306  │
                  └────────┘  └────────┘
```

### Services

| Service | Technology | Port | Responsibility |
|---------|-----------|------|----------------|
| **client** | Angular 9, Nginx | 4200 | SPA frontend |
| **api** (nodeapi) | Node.js 18, Express | 5000 | User auth, shop, products, orders |
| **webapi** (javaapi) | Spring Boot 2 / Java 17 | 9000 | Books catalogue (CRUD) |
| **nginx** | Nginx 1.25 | 80 | Reverse proxy / API gateway |
| **emongo** | MongoDB 6 | 27017 | Document store (local dev) |
| **emartdb** | MySQL 8.0.33 | 3306 | Relational store (local dev) |

> **Production databases**: MongoDB Atlas replaces emongo; a managed MySQL (or Atlas SQL) replaces emartdb.

---

## Phase 1 Verdict: Modular Microservices-Ready Monolith

The repository already contains three distinct backend services. This is **not** a monolith—it is a naturally decomposed application. Phase 1 keeps this decomposition but:

- Adds a proper secrets strategy (HashiCorp Vault)
- Adds network isolation and health checks
- Adds observability (Prometheus, Grafana, Loki)
- Migrates CI from Jenkins to GitHub Actions
- Hardens Dockerfiles (non-root, pinned images)

**Microservices concerns that are deferred to Phase 3+**:
- Service mesh (Istio / Linkerd)
- gRPC / event-driven communication
- Per-service databases with strict ownership
- Independent deployment pipelines with zero-downtime blue-green

---

## Phased Roadmap

### Phase 1 – Docker Compose Foundation ✅ (current branch)
- Docker Compose with env-var-based secrets
- Vault integration (init + sync scripts)
- GitHub Actions CI/CD
- Trivy image scanning
- SonarQube static analysis
- Prometheus + Grafana + Loki observability stack
- Hardened Dockerfiles (non-root, Node 18 / JDK 17)
- Terraform module for MongoDB Atlas
- Comprehensive documentation

### Phase 2 – Security Hardening & Observability
- Vault Agent Injector for automatic secret rotation
- Enable Vault dynamic secrets for MongoDB and MySQL
- Add `prom-client` to nodeapi for application metrics
- Add Spring Boot Actuator + Micrometer to javaapi
- Nexus Repository for Maven and npm artifact storage
- Datadog Agent integration (free tier)
- Harness CD pipeline (free tier)
- Branch protection rules + required status checks
- SAST via CodeQL

### Phase 3 – Rancher, Helm & Kubernetes Readiness
- Helm chart per service (extend kkartchart)
- Kubernetes manifests with resource limits and probes
- Argo CD GitOps deployment
- Vault Agent Injector (Kubernetes)
- Horizontal Pod Autoscaler
- Ingress controller (Nginx Ingress / Traefik)
- Cert-manager for TLS

### Phase 4 – Enterprise & Scale
- Service mesh (Linkerd or Istio)
- OpenTelemetry distributed tracing
- KEDA event-driven autoscaling
- Multi-environment (dev / staging / prod) GitOps flows
- Hostinger Horizon or alternative production hosting

---

## Tooling Decisions

| Tool | Phase | Decision |
|------|-------|----------|
| Docker + Compose | 1 | ✅ Use now |
| HashiCorp Vault | 1 | ✅ Use now |
| GitHub Actions | 1 | ✅ Use now |
| Trivy | 1 | ✅ Use now |
| SonarQube | 1 | ✅ Use now (community) |
| Prometheus / Grafana / Loki | 1 | ✅ Use now |
| Terraform | 1 | ✅ Use now (Atlas module) |
| MongoDB Atlas | 1 | ✅ Free tier |
| Datadog | 2 | Free trial |
| Harness | 2 | Free tier |
| Nexus Repository | 2 | Community edition |
| Argo CD | 3 | After Kubernetes migration |
| Rancher | 3 | When moving off Compose |
| Helm | 3 | kkartchart already exists |
| Kubernetes | 3 | Phase 3 target |
| Istio / Linkerd | 4 | After K8s is stable |
| Redis | 2 | Add for session caching if needed |

---

## Security Design

1. **No secrets in source control** – all sensitive values via `.env` + Vault
2. **Vault AppRole** for non-human authentication
3. **Least-privilege Vault policy** (`infrastructure/vault/policies/emartapp-policy.hcl`)
4. **Non-root containers** – all Dockerfiles add a dedicated `emartuser`
5. **Pinned base images** – Node 18-alpine, Nginx 1.25-alpine, Eclipse Temurin 17
6. **Trivy scanning** in every CI run (SARIF uploaded to GitHub Security tab)
7. **Admin role via env var** (`ADMIN_EMAILS`) – never inferred from user input
8. **SMTP disabled by default** in local dev (`SMTP_ENABLED=false`)
9. **Health checks** on all stateful services before dependent containers start
10. **Docker networks** – all services on a named bridge network, no `--net=host`
