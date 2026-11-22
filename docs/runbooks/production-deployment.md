# Production Deployment Runbook

**System:** Single-Vendor B2C E-Commerce Platform  
**Target Environment:** Linux (Ubuntu 22.04 LTS / Debian 12 / Docker Compose)  
**Standard Port Bindings:** Nginx HTTP (80), HTTPS (443), Internal API (4000), Storefront (3000), Admin (3001)

---

## 1. Prerequisites & Infrastructure Sizing

- **Host Specs (Minimum Recommended for Production):**
  - 4 vCPUs, 8 GB RAM, 50 GB NVMe SSD storage.
  - Docker Engine v24.0+ and Docker Compose v2.20+.
  - Fully qualified domain names (FQDN) pointed to server IP:
    - `shop.yourdomain.com` (Storefront)
    - `admin.yourdomain.com` (Admin Console)
    - `api.yourdomain.com` (REST API & WebSockets)

---

## 2. Environment Configuration

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
2. Configure mandatory production secrets:
   ```ini
   NODE_ENV=production
   POSTGRES_USER=ecommerce
   POSTGRES_PASSWORD=your_secure_db_password_here
   POSTGRES_DB=ecommerce_prod
   
   REDIS_PASSWORD=your_secure_redis_password_here
   MEILI_MASTER_KEY=your_meilisearch_master_key_here
   
   JWT_SECRET=your_jwt_signing_secret_min_64_chars
   JWT_REFRESH_SECRET=your_jwt_refresh_signing_secret_min_64_chars
   
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_hmac_secret
   
   S3_ENDPOINT=https://s3.your-region.amazonaws.com
   S3_ACCESS_KEY=your_s3_key
   S3_SECRET_KEY=your_s3_secret
   S3_BUCKET=ecommerce-production-media
   ```

---

## 3. Building and Starting Containers

Execute production orchestration from `infra/docker/`:
```bash
docker compose -f infra/docker/docker-compose.prod.yml up -d --build
```

Verify all containers reach healthy status:
```bash
docker compose -f infra/docker/docker-compose.prod.yml ps
```

---

## 4. Database Migration & Initial Seeding

Apply pending Prisma migrations and seed system permissions:
```bash
docker compose -f infra/docker/docker-compose.prod.yml exec api npx prisma migrate deploy
docker compose -f infra/docker/docker-compose.prod.yml exec api npx ts-node prisma/seed.ts
```

Alternatively, use the convenience automation script:
```bash
./infra/scripts/seed-production.sh
```

---

## 5. Healthcheck & Probe Verification

Run the automated healthcheck script:
```bash
./infra/scripts/healthcheck.sh
```

Expected output:
```text
🩺 Performing healthcheck checks across platform services...
  [OK] Backend API is healthy (HTTP 200) -> http://localhost:4000/v1/health
  [OK] Meilisearch Engine is healthy (HTTP 200) -> http://localhost:7700/health
  [OK] Storefront Web App is healthy (HTTP 200) -> http://localhost:3000
  [OK] Admin Console is healthy (HTTP 200) -> http://localhost:3001
🏁 Healthcheck probe complete.
```

---

## 6. Zero-Downtime Rollback Procedure

If an unhealthy deployment occurs:
1. Revert to previous Docker image or Git commit:
   ```bash
   git checkout <previous_stable_tag>
   docker compose -f infra/docker/docker-compose.prod.yml up -d --build --no-deps api web admin
   ```
2. Verify rollback state:
   ```bash
   ./infra/scripts/healthcheck.sh
   ```
