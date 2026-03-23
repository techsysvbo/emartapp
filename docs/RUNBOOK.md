# E-MART – Operations Runbook

## Health Checks

```bash
# Check all container status
docker compose ps

# Check logs for a specific service
docker compose logs -f api
docker compose logs -f webapi
docker compose logs -f nginx

# Tail all logs
docker compose logs -f
```

---

## Starting the Stack

```bash
# App only
docker compose up -d

# App + observability
docker compose --profile observability up -d

# Force rebuild (after code changes)
docker compose up -d --build

# Rebuild a single service
docker compose up -d --build api
```

---

## Stopping the Stack

```bash
# Stop without removing data volumes
docker compose down

# Stop and remove all data (destroys MongoDB and MySQL data)
docker compose down -v
```

---

## Database Operations

### MongoDB

```bash
# Open a Mongo shell
docker exec -it emongo mongosh epoc

# Backup
docker exec emongo mongodump --db epoc --out /tmp/backup
docker cp emongo:/tmp/backup ./backups/mongo/$(date +%Y%m%d)

# Restore
docker cp ./backups/mongo/YYYYMMDD emongo:/tmp/restore
docker exec emongo mongorestore --db epoc /tmp/restore/epoc
```

### MySQL

```bash
# Open MySQL shell (password from .env)
docker exec -it emartdb mysql -uroot -p books

# Backup
docker exec emartdb mysqldump -uroot -p"${MYSQL_PASSWORD}" books > ./backups/mysql/books-$(date +%Y%m%d).sql

# Restore
docker exec -i emartdb mysql -uroot -p"${MYSQL_PASSWORD}" books < ./backups/mysql/books-YYYYMMDD.sql
```

---

## Observability

### Grafana
- URL: http://localhost:3000
- Login: admin / (from `GRAFANA_ADMIN_PASSWORD` in `.env`)
- Datasources (Prometheus + Loki) are auto-provisioned.

### Prometheus
- URL: http://localhost:9090
- Check target health: http://localhost:9090/targets

### Loki / Log queries (in Grafana Explore)
```logql
# All API logs
{container_name="api"}

# Error logs across all services
{job="containerlogs"} |= "error"

# Filter by HTTP 5xx
{container_name="nginx"} |~ "\" 5[0-9][0-9] "
```

---

## Updating Secrets

```bash
# 1. Update the secret in Vault
vault kv patch secret/emartapp/nodeapi JWT_SECRET=$(openssl rand -hex 32)

# 2. Re-sync .env
VAULT_ROLE_ID=<id> VAULT_SECRET_ID=<id> ./scripts/vault-sync.sh

# 3. Restart the affected service
docker compose up -d --no-deps api
```

---

## CI/CD

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | Any push / PR | Build, test, Trivy scan |
| `cd.yml` | Push to main | Build images, push to GHCR, deploy to dev via SSH |
| `sonarqube.yml` | Push to main/develop, PR | SonarQube static analysis |

Required GitHub Actions secrets:
- `SONAR_TOKEN` – SonarQube auth token
- `SONAR_HOST_URL` – SonarQube server URL
- `DEPLOY_HOST` – target SSH host
- `DEPLOY_USER` – SSH username
- `DEPLOY_KEY` – SSH private key (ED25519)
- `VAULT_TOKEN` – Vault token for deploy-time secret sync
- `VAULT_ADDR` – Vault server address

---

## Incident Response

### Container restarting in a loop

```bash
docker compose logs --tail=50 <service>
# Look for missing env vars, DB connection errors, or port conflicts
```

### Database unreachable

1. Check container is running: `docker compose ps emongo`
2. Check logs: `docker compose logs emongo`
3. Verify env vars are set: `docker compose config | grep MONGO`
4. If using Atlas, check network access in Atlas UI and IP allowlist.

### JWT auth failures (all users logged out)

This happens if `JWT_SECRET` changes. Existing tokens signed with the old secret are invalid. This is expected behaviour after a secret rotation. Users must log in again.

---

## Container Image Registry

Images are published to GitHub Container Registry (GHCR):

```
ghcr.io/<owner>/emartapp/nodeapi:<sha>
ghcr.io/<owner>/emartapp/client:<sha>
ghcr.io/<owner>/emartapp/javaapi:<sha>
```

Pull latest for a service:
```bash
docker pull ghcr.io/<owner>/emartapp/nodeapi:latest
```
