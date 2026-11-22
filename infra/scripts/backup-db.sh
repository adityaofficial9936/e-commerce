#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Automated PostgreSQL Production Backup Script
# Creates compressed, timestamped database dumps.
# ==============================================================================

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/ecommerce_db_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

mkdir -p "${BACKUP_DIR}"

echo "📦 Starting database backup to ${BACKUP_FILE}..."

# Execute pg_dump inside container or directly via connection string
if [ "${DOCKER_CONTAINER:-}" != "" ]; then
  docker exec -t "${DOCKER_CONTAINER}" pg_dump -U "${POSTGRES_USER:-ecommerce}" "${POSTGRES_DB:-ecommerce_prod}" | gzip > "${BACKUP_FILE}"
else
  pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILE}"
fi

BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo "✅ Database backup complete! Size: ${BACKUP_SIZE}"

# Retention Cleanup
echo "🧹 Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "ecommerce_db_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "✨ Backup job finished successfully."
