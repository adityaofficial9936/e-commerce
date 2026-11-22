#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# PostgreSQL Database Restoration Script
# Restores a compressed SQL dump.
# Usage: ./restore-db.sh <path-to-sql.gz>
# ==============================================================================

if [ -z "${1:-}" ]; then
  echo "❌ Error: Please provide the path to the backup file to restore."
  echo "Usage: $0 ./backups/postgres/ecommerce_db_YYYYMMDD_HHMMSS.sql.gz"
  exit 1
fi

RESTORE_FILE="$1"

if [ ! -f "${RESTORE_FILE}" ]; then
  echo "❌ Error: Backup file '${RESTORE_FILE}' does not exist."
  exit 1
fi

echo "⚠️  WARNING: Restoring will overwrite existing data in '${DATABASE_URL:-ecommerce_prod}'."
read -p "Type 'CONFIRM' to proceed with the restoration: " CONFIRMATION

if [ "${CONFIRMATION}" != "CONFIRM" ]; then
  echo "🚫 Restore cancelled by user."
  exit 0
fi

echo "⏳ Restoring database from ${RESTORE_FILE}..."

if [ "${DOCKER_CONTAINER:-}" != "" ]; then
  gunzip -c "${RESTORE_FILE}" | docker exec -i "${DOCKER_CONTAINER}" psql -U "${POSTGRES_USER:-ecommerce}" -d "${POSTGRES_DB:-ecommerce_prod}"
else
  gunzip -c "${RESTORE_FILE}" | psql "${DATABASE_URL}"
fi

echo "✅ Database restore finished successfully!"
