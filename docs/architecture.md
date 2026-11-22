# E-Commerce Platform: Project Documentation and Folder Structure
**Date:** 14 Nov 2026 · **Author:** @Aditya Yadav

## 1. Project Overview

This is a single-vendor B2C e-commerce platform (web storefront, admin panel, and REST API) built so that one developer can start the MVP alone and a team can grow it later. Anyone who reads this document should be able to understand the whole system, find where any code belongs, and follow the same standards.

### Scope (Version 1)
- **Customer storefront:** browse, search, cart, checkout, pay, track orders, return, get support
- **Admin panel:** catalog, inventory, orders, customers, coupons, CMS, reports, staff and roles
- **Customer support:** tickets, live chat with an AI assistant, returns and refunds
- **Payments:** Razorpay (India) with Stripe-ready abstraction, plus Cash on Delivery
- **Currency:** INR first. The data model stores money in the smallest unit (paise) so other currencies can be added later

### Out of Scope for Version 1 (Designed for, not built)
- Multi-vendor marketplace and seller payouts
- Own logistics and delivery-partner app
- Native mobile apps (the API is mobile-ready)

### Guiding Principles
1. **Money and stock are correct first, fast second:** PostgreSQL transactions, integer amounts (paise), idempotent payment handling.
2. **Modular monolith first:** one NestJS application split into strict modules, which can be split into services later if needed.
3. **Types are shared:** one TypeScript contract between frontend and backend, so API changes break the build instead of production.
4. **Everything runs from one command (`docker compose up`):** so a new developer is productive in under an hour.
5. **Mobile-first responsive UI, accessible (WCAG AA), SEO-friendly:** through server-side rendering.

---

## 2. Tech Stack and Architecture

The platform is a **modular monolith**: two Next.js apps talk to one NestJS API, and that API is the only component that touches the database, cache, search index, and outside services.

### Stack Breakdown

| Layer | Choice | Why |
| :--- | :--- | :--- |
| **Storefront** | Next.js (App Router), TypeScript, Tailwind CSS | Server rendering & ISR give fast pages and good SEO. Mobile-first breakpoints. |
| **Admin panel** | Next.js, TypeScript, Tailwind CSS, TanStack Query | Same tooling as storefront. Mostly client-rendered. |
| **Backend** | NestJS, TypeScript | Modules, dependency injection, guards, and pipes give strong structure. |
| **Validation** | Zod schemas in `packages/contracts`, `nestjs-zod` | Single schema source validates API inputs and frontend forms. |
| **Database** | PostgreSQL with Prisma | Transactions, constraints, and joins for orders, payments, and stock. |
| **Cache & Queues** | Redis, BullMQ | Cache, rate limits, OTP, guest carts, background jobs. |
| **Search** | Meilisearch | Typo-tolerant search and filters with minimal setup. |
| **Media** | Cloudinary or S3 with CDN | Direct signed uploads, image resizing, and fast delivery. |
| **Payments** | Razorpay (Stripe abstraction) | UPI, cards, net banking, wallets, EMI, refunds, webhooks. |
| **Real time** | Socket.IO with Redis adapter | Live chat and agent console across multiple API instances. |
| **Tooling** | pnpm, Turborepo, ESLint, Prettier, Husky, commitlint | Fast, consistent monorepo workflow. |
| **Testing** | Jest, Supertest, Vitest, Playwright | Unit, API, UI, and end-to-end tests. |
| **Delivery** | Docker, GitHub Actions, Nginx | Predictable containers, automated checks, and deploys. |
| **Monitoring** | Sentry, Pino logs, uptime checks | Observability before customer reports. |

---

## 3. User Roles and Access Control (RBAC)

Access is controlled by permissions, not by role names. A permission is a string like `product:create` or `refund:approve`. Roles are named bundles of permissions stored in the database.

### Role Definitions
- **Guest:** Not logged in (Storefront)
- **Customer:** Registered buyer (Storefront)
- **Super Admin:** Owner or tech lead, full control (Admin)
- **Catalog Manager:** Adds products, categories, prices (Admin)
- **Order Manager:** Packs, ships, handles returns (Admin)
- **Support Agent:** Answers tickets and chats (Admin support desk)
- **Support Lead:** Agent rights plus refund approval up to a limit (Admin support desk)
- **Marketing Manager:** Coupons, banners, CMS pages, SEO (Admin)
- **Finance Manager:** Payments, settlements, refunds above limit, GST reports (Admin)

### Enforcement Rules
1. Tables: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`.
2. Short-lived access token (15 mins) + rotating refresh token stored in HTTP-only cookie.
3. Decorators in NestJS (`@RequirePermissions('order:update')`) with `AuthGuard` and `PermissionsGuard`. Denied by default.
4. Ownership verified at the service layer (customers access only their own resources).
5. Two-factor authentication required for staff accounts.
6. Immutable audit log: every staff write action logs actor, target, diff, IP, and timestamp.

---

## 4. Functional Modules

- **Auth and Accounts:** Email/password, OTP, Google OAuth, 2FA, address book, sessions.
- **Catalog:** Hierarchical categories, brands, products with multi-attribute variants, images, specs, reviews.
- **Search & Discovery:** Meilisearch integration, typo tolerance, faceted filtering, autocomplete.
- **Cart:** Guest cart (Redis/cookie) merging into persistent DB cart on login.
- **Checkout & Orders:** Address selection, GST tax & shipping engine, order state machine.
- **Inventory:** Atomic stock reservation (15-min TTL), stock movements audit table, concurrency locking.
- **Payments:** Provider abstraction (`RazorpayProvider`, `StripeProvider`, `CodProvider`), webhook idempotency.
- **Returns & Refunds:** Multi-tier refund approval, reverse logistics inspection, automated payouts.
- **Coupons & CMS:** Fixed/percentage discounts, usage limits, dynamic home layouts, banners.
- **Customer Support:** Ticket SLA clock, live chat gateway, read-only customer-scoped AI bot, escalation console.

---

## 5. Folder Structure & Monorepo Layout

```text
ecommerce-platform/
├── apps/
│   ├── api/                    # NestJS backend (REST API)
│   ├── web/                    # Next.js storefront (customers)
│   └── admin/                  # Next.js admin panel (staff)
├── packages/
│   ├── contracts/              # Shared Zod schemas, types, enums, permission list
│   ├── ui/                     # Shared React components (buttons, inputs, tables)
│   └── config/                 # Shared tsconfig, eslint, prettier, tailwind preset
├── infra/
│   ├── docker/                 # docker-compose.prod.yml, init scripts
│   ├── nginx/                  # reverse proxy and TLS config
│   └── scripts/                # backup, restore, deploy shell scripts
├── docs/
│   ├── architecture.md
│   ├── adr/
│   ├── api/
│   ├── database/
│   └── runbooks/
├── .github/workflows/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 6. Core Backend Guidelines

- **Strict Layering:** Controller (HTTP mapping) -> Service (business logic & transactions) -> Repository (Prisma only).
- **Concurrency & Stock:** `SELECT ... FOR UPDATE` row locks inside PostgreSQL transactions during checkout.
- **Domain Events:** Asynchronous side effects (emails, search sync, PDF generation) decoupled via BullMQ & EventEmitter.
- **Money Representation:** Always integer paise (`_minor`), explicit currency codes.
