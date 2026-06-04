# Chiba-Tech — Architecture

## System Overview

```
Browser / Mobile
      │
      │ HTTPS
      ▼
┌─────────────────────┐
│  React SPA (Vite)   │  :5173 (dev) / :80 (prod, served by Nginx or CDN)
│  shadcn/ui + Tailwind│
└────────┬────────────┘
         │ REST JSON  /api/*
         ▼
┌─────────────────────┐
│   Go HTTP Server    │  :8080
│   Chi router        │
│   JWT middleware    │
│   Handlers →        │
│   Services →        │
│   Repository (sqlc) │
└────────┬────────────┘
         │ pgx/v5
         ▼
┌─────────────────────┐
│    PostgreSQL 15     │
│    (local / RDS)    │
└─────────────────────┘
         ▲
         │ goose migrate
         │ (run once at deploy)
```

External integrations:
- **Stripe** — Payment Intent API for card payments; webhook to confirm payment
- **PayPal** — Orders API v2 for PayPal checkout

## Key Technical Decisions

### Go Backend
- **Chi** chosen for its lightweight, idiomatic middleware chain and clean subrouter nesting.
- **sqlc** generates type-safe Go from plain SQL, avoiding ORM magic while keeping queries maintainable.
- **pgx/v5** is the most performant PostgreSQL driver; used via `pgxpool` for connection pooling.
- Clean layering: `handlers` (HTTP) → `services` (business logic) → `repository` (DB queries).

### React Frontend
- **Vite** for fast HMR and minimal config.
- **shadcn/ui** copies components into the project — no runtime library dependency, fully customisable.
- **TanStack Query v5** manages server state, caching, and background refetching.
- **Zustand** for cart client state (also persisted to the API).
- **React Hook Form + Zod** for declarative, type-safe form validation.

### Database
- UUID v4 primary keys (`gen_random_uuid()`) for all tables.
- `specs JSONB` on `products` stores flexible key-value specifications without extra tables.
- `contact_info JSONB` on `staff_profiles` stores flexible contact channels (phone, email, LinkedIn).
- `product_name TEXT` snapshot on `order_items` preserves the name at time of purchase.
- Goose manages schema versioning with up/down SQL migrations.

### Authentication
- JWT access token (15 min) + refresh token (7 days) stored in httpOnly cookies (production) or localStorage (dev).
- `role` field on `users` (`customer` | `admin`) — admin guard middleware checks this on every `/api/admin/*` request.

## Folder Conventions

- All reusable React components live under `src/components/`.
- Page-level components (one per route) live under `src/pages/`.
- Custom hooks (`useAuth`, `useCart`, etc.) live under `src/hooks/`.
- Go domain logic lives in `internal/services/`; HTTP concerns stay in `internal/handlers/`.
