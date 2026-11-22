# E-Commerce Platform

A production-grade, single-vendor B2C e-commerce platform built as a modular monolith.

- **Storefront (`apps/web`)**: Next.js App Router, SSR/ISR, Tailwind CSS
- **Admin Panel (`apps/admin`)**: Next.js, TanStack Query, Tailwind CSS
- **API (`apps/api`)**: NestJS, PostgreSQL + Prisma, Redis + BullMQ, Meilisearch, Razorpay
- **Shared Contracts (`packages/contracts`)**: Zod validation schemas, TypeScript interfaces, RBAC permissions
- **Shared UI (`packages/ui`)**: Tailwind-based reusable UI primitives

## Documentation

Full architectural specification and folder conventions are documented in:
- [`docs/architecture.md`](docs/architecture.md)

## Quick Start (Phase 0 Foundation)

```bash
# 1. Start backing services
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Setup database
pnpm --filter api prisma migrate dev
pnpm --filter api db:seed

# 4. Start all applications
pnpm dev
```
