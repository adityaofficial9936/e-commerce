# Disaster Recovery & Backup Runbook

**System:** Single-Vendor B2C E-Commerce Platform  
**RPO (Recovery Point Objective):** 1 Hour  
**RTO (Recovery Time Objective):** 15 Minutes  

---

## 1. Backup Schedule & Strategy

| Asset | Mechanism | Frequency | Retention | Storage Location |
|---|---|---|---|---|
| **PostgreSQL Database** | Compressed `pg_dump` (.sql.gz) | Hourly & Nightly | 14 Days | Off-site S3 / EBS Snapshot |
| **Uploaded Media** | S3 / MinIO Versioning | Continuous Replication | 90 Days | Multi-AZ Bucket Storage |
| **Meilisearch Index** | Automated Re-indexing from DB | On Demand | N/A | Ephemeral volume rehydrated via API |
| **Redis State** | Append-Only File (AOF) + RDB | Every 1 Second (AOF) | N/A | Persistent Docker Volume |

---

## 2. Triggering an Immediate Backup

Run the automated backup script:
```bash
./infra/scripts/backup-db.sh
```

To backup directly from the running production container:
```bash
DOCKER_CONTAINER=ecommerce-prod-postgres ./infra/scripts/backup-db.sh
```

Dumps are stored with timestamping under:
`./backups/postgres/ecommerce_db_YYYYMMDD_HHMMSS.sql.gz`

---

## 3. Database Restoration Procedure

In the event of database corruption or hardware failure:

1. Stop application traffic:
   ```bash
   docker compose -f infra/docker/docker-compose.prod.yml stop api web admin
   ```

2. Execute restoration script specifying target backup file:
   ```bash
   DOCKER_CONTAINER=ecommerce-prod-postgres ./infra/scripts/restore-db.sh ./backups/postgres/ecommerce_db_20261116_120000.sql.gz
   ```
   *You will be prompted to type `CONFIRM` to verify overwrite.*

3. Start services and re-sync search index:
   ```bash
   docker compose -f infra/docker/docker-compose.prod.yml start api web admin
   ```

4. Trigger Meilisearch re-index from catalog:
   ```bash
   curl -X POST http://localhost:4000/v1/search/sync -H "Authorization: Bearer <ADMIN_TOKEN>"
   ```

---

## 4. Cold Site Failover Runbook

1. Provision new VM / cloud host.
2. Clone repository:
   ```bash
   git clone <repo-url> ecommerce-platform && cd ecommerce-platform
   ```
3. Copy `.env` secrets from encrypted password vault.
4. Download latest database backup from offsite S3:
   ```bash
   aws s3 cp s3://ecommerce-backups/latest.sql.gz ./backups/postgres/
   ```
5. Start infrastructure and restore database:
   ```bash
   docker compose -f infra/docker/docker-compose.prod.yml up -d postgres redis meilisearch minio
   DOCKER_CONTAINER=ecommerce-prod-postgres ./infra/scripts/restore-db.sh ./backups/postgres/latest.sql.gz
   ```
6. Start remaining application services:
   ```bash
   docker compose -f infra/docker/docker-compose.prod.yml up -d
   ```
7. Verify health:
   ```bash
   ./infra/scripts/healthcheck.sh
   ```
