# Chiba-Tech — Database Schema

All tables use `id UUID DEFAULT gen_random_uuid() PRIMARY KEY` and `created_at TIMESTAMPTZ DEFAULT now()`.

---

## users

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | TEXT | UNIQUE NOT NULL |
| password_hash | TEXT | NOT NULL |
| first_name | TEXT | NOT NULL |
| last_name | TEXT | NOT NULL |
| phone | TEXT | |
| role | TEXT | `customer` \| `admin`, DEFAULT `customer` |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## addresses

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| street | TEXT | NOT NULL |
| city | TEXT | NOT NULL |
| state | TEXT | |
| country | TEXT | NOT NULL |
| zip_code | TEXT | |
| is_default | BOOL | DEFAULT false |
| created_at | TIMESTAMPTZ | |

---

## categories

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| parent_id | UUID | FK → categories.id, nullable (top-level) |
| name | TEXT | NOT NULL |
| slug | TEXT | UNIQUE NOT NULL |
| description | TEXT | |
| image_url | TEXT | |
| sort_order | INT | DEFAULT 0 |
| created_at | TIMESTAMPTZ | |

---

## products

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| category_id | UUID | FK → categories.id |
| name | TEXT | NOT NULL |
| slug | TEXT | UNIQUE NOT NULL |
| description | TEXT | |
| price | NUMERIC(12,2) | NOT NULL |
| compare_price | NUMERIC(12,2) | nullable (original price for sale display) |
| stock_qty | INT | DEFAULT 0 |
| sku | TEXT | UNIQUE |
| specs | JSONB | key-value product specs |
| is_active | BOOL | DEFAULT true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## product_images

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| product_id | UUID | FK → products.id ON DELETE CASCADE |
| url | TEXT | NOT NULL |
| is_primary | BOOL | DEFAULT false |
| sort_order | INT | DEFAULT 0 |
| created_at | TIMESTAMPTZ | |

---

## cart_items

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id ON DELETE CASCADE |
| product_id | UUID | FK → products.id ON DELETE CASCADE |
| quantity | INT | NOT NULL, CHECK > 0 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

UNIQUE(user_id, product_id)

---

## orders

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| address_id | UUID | FK → addresses.id |
| status | TEXT | `pending` \| `confirmed` \| `shipped` \| `delivered` \| `cancelled` |
| payment_method | TEXT | `stripe` \| `paypal` \| `cod` |
| payment_status | TEXT | `pending` \| `paid` \| `failed` |
| payment_ref | TEXT | Stripe PaymentIntent ID or PayPal order ID |
| subtotal | NUMERIC(12,2) | |
| shipping_fee | NUMERIC(12,2) | DEFAULT 0 |
| total | NUMERIC(12,2) | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## order_items

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders.id ON DELETE CASCADE |
| product_id | UUID | FK → products.id |
| product_name | TEXT | snapshot at time of order |
| unit_price | NUMERIC(12,2) | snapshot at time of order |
| quantity | INT | NOT NULL |
| created_at | TIMESTAMPTZ | |

---

## services

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | TEXT | NOT NULL |
| slug | TEXT | UNIQUE NOT NULL |
| description | TEXT | |
| base_price | NUMERIC(12,2) | nullable (quote-based) |
| is_active | BOOL | DEFAULT true |
| created_at | TIMESTAMPTZ | |

---

## staff_profiles

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id UNIQUE |
| title | TEXT | e.g. "Hardware Technician" |
| bio | TEXT | |
| contact_info | JSONB | e.g. `{"phone": "...", "email": "..."}` |
| is_available | BOOL | DEFAULT true |
| created_at | TIMESTAMPTZ | |

---

## appointments

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| staff_id | UUID | FK → staff_profiles.id, nullable |
| service_id | UUID | FK → services.id |
| scheduled_date | DATE | NOT NULL |
| scheduled_time | TIME | NOT NULL |
| status | TEXT | `pending` \| `confirmed` \| `completed` \| `cancelled` |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## Indexes

```sql
CREATE INDEX ON products(category_id);
CREATE INDEX ON products(slug);
CREATE INDEX ON products(is_active);
CREATE INDEX ON cart_items(user_id);
CREATE INDEX ON orders(user_id);
CREATE INDEX ON orders(status);
CREATE INDEX ON order_items(order_id);
CREATE INDEX ON appointments(user_id);
CREATE INDEX ON appointments(scheduled_date);
CREATE INDEX ON appointments(status);
```
