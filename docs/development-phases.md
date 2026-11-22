# E-Commerce Platform: 10-Phase Development Roadmap

This roadmap breaks down the entire single-vendor B2C e-commerce platform into 10 structured, progressive phases. Development strictly follows the principle: **"Money and stock are correct first, fast second."**

Each phase contains:
1. **Core Objectives & Scope**
2. **Key Backend Modules, Contracts & Endpoints**
3. **Database & Infrastructure Touchpoints**
4. **Exit Gate (Definition of Done)** — must be fully satisfied before moving to the next phase.

---

```
  ┌──────────────────────────────────────────────────────────────┐
  │ Phase 1: Foundation, Backing Infra & Core Architecture       │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
  ┌──────────────────────────────▼───────────────────────────────┐
  │ Phase 2: Authentication, User Profiles & RBAC Security       │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
  ┌──────────────────────────────▼───────────────────────────────┐
  │ Phase 3: Catalog, Hierarchical Categories & Product Variants │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
  ┌──────────────────────────────▼───────────────────────────────┐
  │ Phase 4: Fast Typo-Tolerant Search & Discovery (Meilisearch) │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
  ┌──────────────────────────────▼───────────────────────────────┐
  │ Phase 5: Cart Engine, Guest Merging & Coupons / Discounts    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
  ┌──────────────────────────────▼───────────────────────────────┐
  │ Phase 6: Checkout, Concurrency & Atomic Stock Reservation    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
  ┌──────────────────────────────▼───────────────────────────────┐
  │ Phase 7: Payment Orchestration (Razorpay, COD & Webhooks)    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
  ┌──────────────────────────────▼───────────────────────────────┐
  │ Phase 8: Order State Machine, Fulfillment & PDF Invoicing    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
  ┌──────────────────────────────▼───────────────────────────────┐
  │ Phase 9: Support Desk, Returns, Refunds & AI Chat Gateway    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
  ┌──────────────────────────────▼───────────────────────────────┐
  │ Phase 10: Storefront & Admin Frontends, Audit & Hardening    │
  └──────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation, Backing Infrastructure & Core Services
- **Focus:** Infrastructure readiness and core backend plumbing.
- **Deliverables:**
  - Docker Compose services verified: PostgreSQL 16, Redis 7, Meilisearch v1.7, MinIO, Mailpit.
  - NestJS Core modules: `PrismaService`, `RedisService`, `PinoLoggerService`.
  - Global filters and interceptors: `AllExceptionsFilter`, standard response envelope (`{ success, data, meta }`), request ID propagation.
  - Environment validation fail-fast schema.
  - Initial Prisma migration and DB seed execution.
- **Exit Gate:** 
  - Backing containers running healthy.
  - Database schema migrated and seeded with default roles & permissions.
  - `GET /v1/health` and `GET /docs` (Swagger) return 200 OK.

---

## Phase 2: Authentication, User Profiles & RBAC Security
- **Focus:** Identity, session management, and granular permission enforcement.
- **Deliverables:**
  - Auth module (`apps/api/src/modules/auth/`): Email + password signup, login, OTP login, forgot/reset password.
  - Token handling: Short-lived JWT access token (15 mins) + rotating refresh token in HTTP-only cookie.
  - Redis-backed permissions cache: Permissions loaded by user ID, refreshed upon role changes.
  - Security guards: `JwtAuthGuard` (skips `@Public()`), `PermissionsGuard` (enforcing `@RequirePermissions(...)`).
  - Users module (`/modules/users/`): Profile management, address book CRUD (shipping/billing).
  - Audit logging: Automatic audit trail for all staff actions in `audit_logs`.
- **Exit Gate:** 
  - Customer can register, log in, manage addresses, and rotate tokens.
  - Staff endpoint access is strictly governed by permissions (denied by default).
  - Integration tests verify token expiration, refresh rotation, and permission denial.

---

## Phase 3: Catalog, Hierarchical Categories & Product Variants
- **Focus:** The product inventory backbone.
- **Deliverables:**
  - Catalog module (`/modules/catalog/`):
    - Recursive category tree (parent/children).
    - Brands management.
    - Products with slug generation, specifications, and SEO metadata.
    - Product Variants with dynamic JSON attributes (e.g., size, color) and unique SKUs.
    - Paise integer money representation (`price_minor`, `mrp_minor`).
  - Media module (`/modules/media/`): Direct signed upload URLs to MinIO/S3 or Cloudinary.
  - Admin endpoints: `/v1/admin/categories`, `/v1/admin/brands`, `/v1/admin/products`.
- **Exit Gate:** 
  - Staff can create categories, brands, and multi-variant products with signed image uploads.
  - Data integrity enforced (unique SKUs, valid price integers, active variant states).

---

## Phase 4: Search & Discovery Engine (Meilisearch)
- **Focus:** Sub-50ms typo-tolerant search and faceted catalog discovery.
- **Deliverables:**
  - Search module (`/modules/search/`): Meilisearch client wrapper, document indexer.
  - Event listeners: Catalog changes automatically dispatch sync jobs to update Meilisearch documents.
  - Public storefront catalog endpoints:
    - `GET /v1/products` (paginated, filtered by category/brand).
    - `GET /v1/products/:slug` (product detail with real-time stock).
    - `GET /v1/search/products` (full-text search, auto-complete, multi-attribute facet filters).
  - CLI reindex command (`pnpm --filter api search:reindex`).
- **Exit Gate:** 
  - Search queries return typo-tolerant results within 50ms.
  - Updating a product instantly updates its search document.

---

## Phase 5: Cart Engine, Guest Merging & Promotions (Coupons)
- **Focus:** High-conversion shopping cart with dynamic pricing rules.
- **Deliverables:**
  - Cart module (`/modules/cart/`):
    - Guest cart in Redis (30-day TTL) using guest session cookie.
    - Authenticated cart in PostgreSQL.
    - Seamless merge of guest items into user cart on login.
    - Live stock and price verification on quantity updates.
  - Coupons module (`/modules/coupons/`):
    - Percentage and flat amount discount rules.
    - Min order value, expiry dates, per-user limits, and category restrictions.
- **Exit Gate:** 
  - Guest cart merges without data loss on login.
  - Out-of-stock items block cart checkout progression.
  - Coupon discount calculations accurately compute paise totals.

---

## Phase 6: Checkout, Concurrency & Atomic Stock Reservation
- **Focus:** The critical money and inventory path.
- **Deliverables:**
  - Checkout module (`/modules/checkout/`):
    - GST tax and weight/pincode shipping calculation engine.
    - Checkout session summary endpoint.
  - Inventory module (`/modules/inventory/`):
    - Row-level lock concurrency (`SELECT ... FOR UPDATE` via Prisma).
    - 15-minute atomic stock reservations (`stock_reservations`).
    - Every stock modification recorded in `stock_movements`.
  - Orders module (`/modules/orders/`):
    - Initial order creation in `PENDING_PAYMENT` state.
    - Order status history tracking.
  - BullMQ reservation worker: Automatic release of reservations after 15 minutes if unpaid.
- **Exit Gate:** 
  - **Concurrency race test passes:** Simultaneous checkout of the last item allows only one buyer to succeed.
  - Expired reservations automatically restore inventory.

---

## Phase 7: Payment Orchestration (Razorpay, COD & Webhooks)
- **Focus:** Zero-trust, idempotent financial transactions.
- **Deliverables:**
  - Payment module (`/modules/payments/`):
    - `PaymentProvider` interface (`RazorpayProvider`, `CodProvider`, `StripeProvider` stub).
    - Server-side Razorpay order creation (minor paise only).
    - Client signature verification (`POST /v1/payments/verify`).
    - Raw-body HMAC webhook handler (`POST /v1/webhooks/razorpay`) with event deduplication in `payment_events`.
    - Idempotent `markPaid()` state transition to `CONFIRMED`.
    - Cash on Delivery (COD) workflow with limits and OTP confirmation.
- **Exit Gate:** 
  - Payment verification succeeds via client callback and webhook.
  - Duplicate webhooks produce no double-counting or secondary state shifts.
  - Money amounts on server and provider match to the paise.

---

## Phase 8: Order State Machine, Fulfillment & PDF Invoicing
- **Focus:** Back-office order handling and post-purchase customer flows.
- **Deliverables:**
  - Order state machine transitions: `CONFIRMED` -> `PACKED` -> `SHIPPED` -> `DELIVERED`.
  - Shipment tracking: Courier details, tracking numbers, customer email notifications.
  - Cancellation rules: Allowed only before `SHIPPED`, triggers restock and automatic refund.
  - Invoices worker: BullMQ job generates PDF tax invoice and stores in MinIO/S3.
  - Customer endpoints: `GET /v1/orders`, `GET /v1/orders/:id`, `GET /v1/orders/:id/invoice`.
- **Exit Gate:** 
  - Order status history logs all state transitions with timestamps and actors.
  - Customer can cancel pre-shipped order and verify restock.
  - PDF invoice generates and downloads with accurate GST breakdowns.

---

## Phase 9: Customer Support Desk, Returns, Refunds & AI Chat
- **Focus:** Customer retention, reverse logistics, and live assistance.
- **Deliverables:**
  - Returns & Refunds module (`/modules/returns/`):
    - Customer return request with photo proof within return window.
    - Inspection status (`RECEIVED`, `INSPECTED`).
    - Refund approvals: Agent request -> Lead approval (up to limit) -> Finance Manager execution.
  - Support Tickets module (`/modules/support/`):
    - Ticket lifecycle, priority levels, SLA countdown clock.
    - Agent assignment and internal notes.
  - Live Chat gateway: Socket.IO with Redis adapter for multi-instance scaling.
  - Read-only AI Assistant: Answers questions strictly scoped to authenticated user orders and FAQ.
- **Exit Gate:** 
  - Full return-to-refund loop tested (return request -> inspection -> refund captured).
  - SLA breach triggers automatic ticket escalation.
  - AI assistant successfully fetches user order tracking and hands off to human on request.

---

## Phase 10: Storefront & Admin Frontends, Audit & Launch Hardening
- **Focus:** High-performance UI, back-office workflows, and production readiness.
- **Deliverables:**
  - Storefront (`apps/web`):
    - Next.js App Router with ISR/SSR for SEO.
    - Responsive mobile-first Tailwind design.
    - Product detail with JSON-LD Product schema.
    - Full cart, checkout, Razorpay popup, and order tracking flow.
  - Admin Panel (`apps/admin`):
    - Permission-filtered sidebar navigation.
    - TanStack Table views for Catalog, Inventory, Orders, Customers, Refunds, Audit Logs.
    - BullMQ job queue monitoring dashboard (Bull Board).
  - Launch Hardening:
    - OWASP Top 10 security review, rate limit tuning.
    - Lighthouse score target: 90+ on mobile.
- **Exit Gate:** 
  - Complete customer purchase journey works flawlessly in browser from homepage to order tracking.
  - Admin can operate catalog, fulfill orders, process refunds, and review audit logs.

---

## Phase 11: Production Deployment Infrastructure, Containerization, Shared UI Component Library, CI/CD Pipeline & E2E Verification Suite
- **Focus:** Multi-stage Docker containers, Nginx reverse proxy gateway, reusable component library, CI/CD pipelines, and end-to-end integration tests.
- **Deliverables:**
  - Shared UI Component Library (`@ecommerce/ui`):
    - Reusable React components: `Button`, `Badge`, `Input`, `Card`, `Modal`, `Alert`, `Table`, `MoneyDisplay`.
    - Zero IEEE-754 floating-point formatters.
  - Multi-stage Dockerfiles (`infra/docker/`):
    - `Dockerfile.api`, `Dockerfile.web`, `Dockerfile.admin` with non-root security principles and Alpine base.
    - `docker-compose.prod.yml` coordinating Postgres 16, Redis 7, Meilisearch 1.7, MinIO S3, API, Web, Admin, and Nginx.
  - Gateway Reverse Proxy (`infra/nginx/nginx.conf`):
    - Rate-limiting zones, SSL termination, HSTS/CSP security headers, WebSocket upgrades for live chat.
  - Operational & Disaster Recovery Runbooks:
    - `backup-db.sh`, `restore-db.sh`, `seed-production.sh`, `healthcheck.sh`.
    - `docs/runbooks/production-deployment.md`, `docs/runbooks/disaster-recovery.md`, `docs/database/schema-design.md`.
  - CI/CD Automation:
    - `.github/workflows/ci.yml` running linting, typechecking across monorepo, Jest tests with coverage, and Next.js builds.
  - End-to-End (E2E) Integration Lifecycle Test:
    - `apps/api/src/e2e/lifecycle.spec.ts` executing the complete unbroken 12-step customer purchase and post-purchase cycle.
- **Exit Gate:**
  - 100% of unit & E2E tests passing (14 test suites, 63 tests).
  - All monorepo packages (`contracts`, `ui`, `api`, `web`, `admin`) build with exit code 0.

---

## Phase 12: Asynchronous BullMQ Job Queues, Transactional Email Notifications & Structured Pino Observability
- **Focus:** Asynchronous worker processing, responsive HTML transactional emails, distributed tracing, request correlation, and detailed subsystem telemetry.
- **Deliverables:**
  - BullMQ Queue Infrastructure (`apps/api/src/modules/queues/`):
    - Dedicated job queues: `EMAIL_QUEUE`, `INVOICE_QUEUE`, `SEARCH_SYNC_QUEUE`, `MAINTENANCE_QUEUE`.
    - Dedicated worker processors: `EmailProcessor`, `InvoiceProcessor`, `SearchSyncProcessor`, `MaintenanceProcessor`.
    - `QueueService`: Exponential retry backoffs (3 attempts), automatic job pruning, and consolidated health metrics retrieval.
  - Transactional Notification Engine (`apps/api/src/modules/notifications/`):
    - Decoupled domain event listeners: `@OnEvent('auth.registered')`, `@OnEvent('order.paid')`, `@OnEvent('order.shipped')`, `@OnEvent('refund.processed')`.
    - Responsive HTML templates: `order-confirmation`, `order-shipped` (courier tracking AWB), `refund-processed`, and `welcome`.
  - Observability, Correlation & Detailed Health (`core/logging/`, `common/middleware/`, `core/health/`):
    - `CorrelationIdMiddleware`: Generates and propagates `X-Correlation-ID` across distributed requests.
    - `LoggingInterceptor`: Structured Pino logging with automatic sensitive field redaction (`password`, `token`, `secret`, `cvv`).
    - `/v1/health/detailed`: Deep SRE telemetry endpoint returning DB query latency, Redis ping latency, BullMQ queue metrics (waiting, active, completed, failed, delayed), and Node.js process memory metrics.
- **Exit Gate:**
  - 100% of unit & integration tests passing (17 test suites, 74 tests).
  - Deep telemetry endpoint `/v1/health/detailed` successfully returns health checks for PostgreSQL, Redis, Queues, and Node memory.

---

## 🏆 Project Delivery & Verification Status (All 12 Phases Complete)

| Phase | Description | Status | Verification & Artifacts |
|---|---|---|---|
| **Phase 1** | Foundation, Backing Infra & Core Services | ✅ Complete | Docker Compose, Prisma 5, Redis 7, Meilisearch, Envelope Interceptors |
| **Phase 2** | Authentication, User Profiles & RBAC Security | ✅ Complete | Argon2id, Rotating Refresh Tokens, 40+ granular RBAC permissions |
| **Phase 3** | Catalog, Hierarchical Categories & Product Variants | ✅ Complete | Recursive category tree, paise integer money, signed S3 media |
| **Phase 4** | Fast Typo-Tolerant Search & Discovery (Meilisearch) | ✅ Complete | Meilisearch sync, live DB price/stock rehydration |
| **Phase 5** | Cart Engine, Guest Merging & Coupons / Discounts | ✅ Complete | Redis guest cart $\to$ Postgres authenticated merge, coupons |
| **Phase 6** | Checkout, Concurrency & Atomic Stock Reservation | ✅ Complete | Row locks (`FOR UPDATE`), 15-min reservation TTL, 18% GST calculation |
| **Phase 7** | Payment Orchestration (Razorpay, COD & Webhooks) | ✅ Complete | Raw body HMAC verification, idempotent `markPaid`, minor paise |
| **Phase 8** | Order State Machine, Fulfillment & PDF Invoicing | ✅ Complete | PACK $\to$ SHIP $\to$ DELIVER, Pure TS GST Tax Invoice PDF generator |
| **Phase 9** | Customer Support Desk, Returns, Refunds & AI Chat | ✅ Complete | 7-day return inspection, restock, multi-tier refund, AI support assistant |
| **Phase 10** | Storefront & Admin Frontends, Audit & Launch Hardening | ✅ Complete | Next.js 14 App Router, Zustand, Tailwind, SEO JSON-LD, Ops Console |
| **Phase 11** | Production Infra, Shared UI, CI/CD & E2E Verification | ✅ Complete | Multi-stage Docker, Nginx, Shared UI library, CI/CD, 12-step E2E suite |
| **Phase 12** | BullMQ Queues, Transactional Emails & Observability | ✅ Complete | 4 Queues, 4 Processors, Responsive HTML emails, Pino logs, /health/detailed |

- **Backend API**: 17 test suites, 74 unit/E2E tests passing, `nest build` exit code 0.
- **Shared Contracts (`packages/contracts`)**: `tsc` exit code 0.
- **Shared UI Library (`packages/ui`)**: `tsc` exit code 0.
- **Storefront App (`apps/web`)**: Next.js production build exit code 0 (7 static/dynamic pages).
- **Admin App (`apps/admin`)**: Next.js production build exit code 0 (8 static pages).

