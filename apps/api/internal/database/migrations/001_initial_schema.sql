-- +goose Up
-- +goose StatementBegin

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- users
CREATE TABLE users (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email        TEXT        NOT NULL UNIQUE,
    password_hash TEXT       NOT NULL,
    first_name   TEXT        NOT NULL,
    last_name    TEXT        NOT NULL,
    phone        TEXT,
    role         TEXT        NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- addresses
CREATE TABLE addresses (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    street     TEXT        NOT NULL,
    city       TEXT        NOT NULL,
    state      TEXT,
    country    TEXT        NOT NULL,
    zip_code   TEXT,
    is_default BOOL        NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- categories (self-referencing for sub-categories)
CREATE TABLE categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID        REFERENCES categories(id) ON DELETE SET NULL,
    name        TEXT        NOT NULL,
    slug        TEXT        NOT NULL UNIQUE,
    description TEXT,
    image_url   TEXT,
    sort_order  INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- products
CREATE TABLE products (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   UUID           NOT NULL REFERENCES categories(id),
    name          TEXT           NOT NULL,
    slug          TEXT           NOT NULL UNIQUE,
    description   TEXT,
    price         NUMERIC(12,2)  NOT NULL CHECK (price >= 0),
    compare_price NUMERIC(12,2)  CHECK (compare_price >= 0),
    stock_qty     INT            NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    sku           TEXT           UNIQUE,
    specs         JSONB          NOT NULL DEFAULT '{}',
    is_active     BOOL           NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- product images
CREATE TABLE product_images (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url        TEXT        NOT NULL,
    is_primary BOOL        NOT NULL DEFAULT false,
    sort_order INT         NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- cart items
CREATE TABLE cart_items (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity   INT         NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

-- orders
CREATE TABLE orders (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID           NOT NULL REFERENCES users(id),
    address_id     UUID           NOT NULL REFERENCES addresses(id),
    status         TEXT           NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
    payment_method TEXT           NOT NULL
                                  CHECK (payment_method IN ('stripe','paypal','cod')),
    payment_status TEXT           NOT NULL DEFAULT 'pending'
                                  CHECK (payment_status IN ('pending','paid','failed')),
    payment_ref    TEXT,
    subtotal       NUMERIC(12,2)  NOT NULL CHECK (subtotal >= 0),
    shipping_fee   NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    total          NUMERIC(12,2)  NOT NULL CHECK (total >= 0),
    notes          TEXT,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- order items (price/name snapshot at time of order)
CREATE TABLE order_items (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   UUID           NOT NULL REFERENCES products(id),
    product_name TEXT           NOT NULL,
    unit_price   NUMERIC(12,2)  NOT NULL CHECK (unit_price >= 0),
    quantity     INT            NOT NULL CHECK (quantity > 0),
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- services
CREATE TABLE services (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT           NOT NULL,
    slug        TEXT           NOT NULL UNIQUE,
    description TEXT,
    base_price  NUMERIC(12,2)  CHECK (base_price >= 0),
    is_active   BOOL           NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- staff profiles (linked to user accounts)
CREATE TABLE staff_profiles (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL UNIQUE REFERENCES users(id),
    title        TEXT        NOT NULL,
    bio          TEXT,
    contact_info JSONB       NOT NULL DEFAULT '{}',
    is_available BOOL        NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- appointments
CREATE TABLE appointments (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id),
    staff_id       UUID        REFERENCES staff_profiles(id),
    service_id     UUID        NOT NULL REFERENCES services(id),
    scheduled_date DATE        NOT NULL,
    scheduled_time TIME        NOT NULL,
    status         TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','confirmed','completed','cancelled')),
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_addresses_user_id         ON addresses(user_id);
CREATE INDEX idx_products_category_id      ON products(category_id);
CREATE INDEX idx_products_slug             ON products(slug);
CREATE INDEX idx_products_is_active        ON products(is_active);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_cart_items_user_id        ON cart_items(user_id);
CREATE INDEX idx_orders_user_id            ON orders(user_id);
CREATE INDEX idx_orders_status             ON orders(status);
CREATE INDEX idx_order_items_order_id      ON order_items(order_id);
CREATE INDEX idx_appointments_user_id      ON appointments(user_id);
CREATE INDEX idx_appointments_date         ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status       ON appointments(status);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS staff_profiles;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS users;
-- +goose StatementEnd
