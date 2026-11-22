#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Production Migration & Database Seed Runner
# Applies pending Prisma migrations and seeds essential system roles/catalog.
# ==============================================================================

echo "🚀 Running Prisma production database migrations..."
cd apps/api
npx prisma migrate deploy

echo "🌱 Seeding initial system permissions, roles, and administrative users..."
npx ts-node prisma/seed.ts

echo "✅ Production migrations and seed completed successfully."
