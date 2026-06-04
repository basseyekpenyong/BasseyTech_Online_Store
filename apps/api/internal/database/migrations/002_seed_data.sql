-- +goose Up
-- +goose StatementBegin

-- Admin user (password: Admin@123 — change before production)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role)
VALUES (
    gen_random_uuid(),
    'admin@chiba-tech.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfvRGFNSrMthu', -- Admin@123
    'Chiba',
    'Admin',
    '+1234567890',
    'admin'
);

-- Top-level categories
INSERT INTO categories (id, name, slug, description, sort_order) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Laptops',             'laptops',             'Laptops and ultrabooks for work and play',                     1),
    ('a1000000-0000-0000-0000-000000000002', 'Phones',              'phones',              'Smartphones and feature phones',                              2),
    ('a1000000-0000-0000-0000-000000000003', 'Accessories',         'accessories',         'Computer and phone accessories',                               3),
    ('a1000000-0000-0000-0000-000000000004', 'Telecom Gadgets',     'telecom-gadgets',     'Routers, modems, and networking equipment',                    4),
    ('a1000000-0000-0000-0000-000000000005', 'Repairs & Parts',     'repairs-parts',       'Spare parts and repair components',                            5);

-- Sub-categories
INSERT INTO categories (id, parent_id, name, slug, sort_order) VALUES
    ('a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Business Laptops',  'business-laptops', 1),
    ('a2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Gaming Laptops',    'gaming-laptops',   2),
    ('a2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Android Phones',    'android-phones',   1),
    ('a2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'iPhones',           'iphones',          2),
    ('a2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'Cables & Chargers', 'cables-chargers',  1),
    ('a2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'Bags & Cases',      'bags-cases',       2);

-- Sample products
INSERT INTO products (id, category_id, name, slug, description, price, compare_price, stock_qty, sku, specs) VALUES
(
    gen_random_uuid(),
    'a2000000-0000-0000-0000-000000000001',
    'Dell XPS 15 (2024)',
    'dell-xps-15-2024',
    'Premium 15-inch business laptop with OLED display and Intel Core i7.',
    1499.99, 1699.99, 12, 'DL-XPS15-2024',
    '{"processor":"Intel Core i7-13700H","ram":"16GB DDR5","storage":"512GB NVMe SSD","display":"15.6\" OLED 3.5K","battery":"86Wh","os":"Windows 11 Pro"}'
),
(
    gen_random_uuid(),
    'a2000000-0000-0000-0000-000000000001',
    'MacBook Pro 14" M3',
    'macbook-pro-14-m3',
    'Apple MacBook Pro with M3 chip — performance and battery life in one.',
    1999.00, NULL, 8, 'AP-MBP14-M3',
    '{"processor":"Apple M3","ram":"18GB Unified","storage":"512GB SSD","display":"14.2\" Liquid Retina XDR","battery":"70Wh","os":"macOS Sonoma"}'
),
(
    gen_random_uuid(),
    'a2000000-0000-0000-0000-000000000003',
    'Samsung Galaxy S24 Ultra',
    'samsung-galaxy-s24-ultra',
    'Samsung flagship with 200MP camera and built-in S Pen.',
    1199.99, 1299.99, 25, 'SG-S24U',
    '{"processor":"Snapdragon 8 Gen 3","ram":"12GB","storage":"256GB","display":"6.8\" Dynamic AMOLED 2X","battery":"5000mAh","os":"Android 14"}'
),
(
    gen_random_uuid(),
    'a2000000-0000-0000-0000-000000000004',
    'iPhone 15 Pro Max',
    'iphone-15-pro-max',
    'Apple iPhone 15 Pro Max with titanium design and Action button.',
    1399.00, NULL, 15, 'AP-IP15PM',
    '{"processor":"Apple A17 Pro","storage":"256GB","display":"6.7\" Super Retina XDR","battery":"4422mAh","os":"iOS 17","camera":"48MP main + 12MP ultrawide + 12MP 5x telephoto"}'
),
(
    gen_random_uuid(),
    'a2000000-0000-0000-0000-000000000005',
    '65W GaN USB-C Charger',
    '65w-gan-usb-c-charger',
    'Compact 65W GaN fast charger with 2x USB-C and 1x USB-A ports.',
    34.99, 49.99, 100, 'CH-GAN65W',
    '{"power":"65W","ports":"2x USB-C, 1x USB-A","technology":"GaN","compatibility":"Universal USB-C devices"}'
);

-- Services
INSERT INTO services (id, name, slug, description, base_price) VALUES
(
    gen_random_uuid(),
    'Hardware Repair',
    'hardware-repair',
    'Professional diagnosis and repair of laptops, phones, and other hardware. Includes screen replacement, battery swap, keyboard repair, and more.',
    29.99
),
(
    gen_random_uuid(),
    'Software Development',
    'software-development',
    'Custom website and application development for businesses worldwide. From simple landing pages to full e-commerce platforms and enterprise apps.',
    499.00
),
(
    gen_random_uuid(),
    'Maintenance & Support',
    'maintenance-support',
    'Ongoing maintenance contracts for software systems, websites, and hardware. Includes updates, backups, and priority support.',
    99.00
),
(
    gen_random_uuid(),
    'Data Recovery',
    'data-recovery',
    'Professional recovery of lost or corrupted data from hard drives, SSDs, phones, and USB drives.',
    79.99
),
(
    gen_random_uuid(),
    'Network Setup',
    'network-setup',
    'Home and office network configuration, Wi-Fi optimisation, and router setup.',
    49.99
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM services;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM users WHERE email = 'admin@chiba-tech.com';
-- +goose StatementEnd
