# Chiba-Tech Platform

Full-stack e-commerce and service-booking platform for Chiba-Tech.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + shadcn/ui + Tailwind CSS |
| Backend | Go + Chi router + sqlc |
| Database | PostgreSQL |
| Migrations | Goose |
| Auth | JWT |
| Payments | Stripe, PayPal, Cash on Delivery |

## Project Layout

```
apps/
  web/    React frontend
  api/    Go backend
docs/     Architecture, requirements, DB schema
```

## Quick Start

### Prerequisites
- Go 1.22+
- Node.js 20+
- PostgreSQL 15+
- [goose](https://github.com/pressly/goose) CLI
- [sqlc](https://sqlc.dev) CLI

### Backend

```bash
cd apps/api
cp .env.example .env          # fill in values
make migrate                  # run DB migrations
make dev                      # start API on :8080
```

### Frontend

```bash
cd apps/web
npm install
npm run dev                   # start dev server on :5173
```

## Features

- Product catalogue (laptops, phones, accessories, telecom gadgets)
- Shopping cart + checkout with Stripe, PayPal, or Cash on Delivery
- Service listings (hardware repair, software development, maintenance)
- Appointment booking with technicians and developers
- Customer accounts with order and appointment history
- Admin dashboard — manage products, categories, orders, services, appointments, staff, and users
