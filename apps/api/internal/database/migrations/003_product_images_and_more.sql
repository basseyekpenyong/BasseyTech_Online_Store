-- +goose Up
-- +goose StatementBegin

-- ─── Images for existing products ────────────────────────────────────────────

INSERT INTO product_images (product_id, url, is_primary, sort_order)
SELECT id,
       'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800&q=80',
       true, 1
FROM products WHERE slug = 'dell-xps-15-2024';

INSERT INTO product_images (product_id, url, is_primary, sort_order)
SELECT id,
       'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
       true, 1
FROM products WHERE slug = 'macbook-pro-14-m3';

INSERT INTO product_images (product_id, url, is_primary, sort_order)
SELECT id,
       'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
       true, 1
FROM products WHERE slug = 'samsung-galaxy-s24-ultra';

INSERT INTO product_images (product_id, url, is_primary, sort_order)
SELECT id,
       'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80',
       true, 1
FROM products WHERE slug = 'iphone-15-pro-max';

INSERT INTO product_images (product_id, url, is_primary, sort_order)
SELECT id,
       'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
       true, 1
FROM products WHERE slug = '65w-gan-usb-c-charger';

-- ─── More Laptops ─────────────────────────────────────────────────────────────

INSERT INTO products (id, category_id, name, slug, description, price, compare_price, stock_qty, sku, specs)
VALUES
(
    'b1000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000001',
    'HP Spectre x360 14"',
    'hp-spectre-x360-14',
    'Convertible 2-in-1 laptop with OLED touch display and pen support.',
    1349.00, 1549.00, 10, 'HP-SPX360-14',
    '{"processor":"Intel Core i7-1355U","ram":"16GB LPDDR5","storage":"1TB NVMe SSD","display":"14\" OLED 2.8K Touch","battery":"66Wh","os":"Windows 11 Home"}'
),
(
    'b1000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000001',
    'Lenovo ThinkPad X1 Carbon Gen 12',
    'lenovo-thinkpad-x1-carbon-gen-12',
    'Ultra-light business laptop weighing just 1.12 kg with MIL-SPEC durability.',
    1599.00, NULL, 7, 'LV-X1CG12',
    '{"processor":"Intel Core Ultra 7 165U","ram":"32GB LPDDR5","storage":"1TB SSD","display":"14\" IPS 2.8K","weight":"1.12 kg","os":"Windows 11 Pro"}'
),
(
    'b1000000-0000-0000-0000-000000000003',
    'a2000000-0000-0000-0000-000000000002',
    'ASUS ROG Strix G16',
    'asus-rog-strix-g16',
    'High-performance gaming laptop with RTX 4070 and 240Hz display.',
    1799.00, 1999.00, 5, 'AS-ROGSG16',
    '{"processor":"AMD Ryzen 9 7945HX","ram":"16GB DDR5","storage":"1TB NVMe SSD","gpu":"NVIDIA RTX 4070 8GB","display":"16\" FHD 240Hz","os":"Windows 11 Home"}'
);

INSERT INTO product_images (product_id, url, is_primary, sort_order) VALUES
('b1000000-0000-0000-0000-000000000001',
 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
 true, 1),
('b1000000-0000-0000-0000-000000000002',
 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
 true, 1),
('b1000000-0000-0000-0000-000000000003',
 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
 true, 1);

-- ─── More Phones ──────────────────────────────────────────────────────────────

INSERT INTO products (id, category_id, name, slug, description, price, compare_price, stock_qty, sku, specs)
VALUES
(
    'b2000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000003',
    'Samsung Galaxy A55 5G',
    'samsung-galaxy-a55-5g',
    'Mid-range Samsung with 50MP camera, 5000mAh battery, and 5G connectivity.',
    399.00, 449.00, 40, 'SG-A55-5G',
    '{"processor":"Exynos 1480","ram":"8GB","storage":"128GB","display":"6.6\" Super AMOLED FHD+","battery":"5000mAh","camera":"50MP + 12MP + 5MP","os":"Android 14"}'
),
(
    'b2000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000003',
    'Tecno Spark 20 Pro',
    'tecno-spark-20-pro',
    'Affordable smartphone with 108MP camera and large 5000mAh battery.',
    179.00, 199.00, 60, 'TC-SP20P',
    '{"processor":"Helio G99","ram":"8GB","storage":"256GB","display":"6.78\" AMOLED 120Hz","battery":"5000mAh","camera":"108MP main","os":"Android 14"}'
),
(
    'b2000000-0000-0000-0000-000000000003',
    'a2000000-0000-0000-0000-000000000003',
    'Infinix Hot 40 Pro',
    'infinix-hot-40-pro',
    'Feature-packed phone with 64MP camera and 45W fast charging.',
    149.00, 169.00, 50, 'IF-H40P',
    '{"processor":"Helio G99 Ultimate","ram":"12GB","storage":"256GB","display":"6.78\" IPS LCD 120Hz","battery":"5000mAh 45W","camera":"64MP main","os":"Android 14"}'
),
(
    'b2000000-0000-0000-0000-000000000004',
    'a2000000-0000-0000-0000-000000000004',
    'iPhone 14',
    'iphone-14',
    'Apple iPhone 14 with A15 Bionic chip and Crash Detection.',
    799.00, 899.00, 20, 'AP-IP14',
    '{"processor":"Apple A15 Bionic","storage":"128GB","display":"6.1\" Super Retina XDR","battery":"3279mAh","camera":"12MP dual","os":"iOS 17"}'
);

INSERT INTO product_images (product_id, url, is_primary, sort_order) VALUES
('b2000000-0000-0000-0000-000000000001',
 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80',
 true, 1),
('b2000000-0000-0000-0000-000000000002',
 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=800&q=80',
 true, 1),
('b2000000-0000-0000-0000-000000000003',
 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
 true, 1),
('b2000000-0000-0000-0000-000000000004',
 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
 true, 1);

-- ─── Accessories ──────────────────────────────────────────────────────────────

INSERT INTO products (id, category_id, name, slug, description, price, compare_price, stock_qty, sku, specs)
VALUES
(
    'b3000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000005',
    'Anker Wireless Earbuds Pro',
    'anker-wireless-earbuds-pro',
    'Premium true wireless earbuds with active noise cancellation and 32-hour total battery.',
    59.99, 79.99, 80, 'AK-TWSPRO',
    '{"type":"True Wireless","anc":"Active Noise Cancellation","battery":"8hrs (32hrs with case)","connectivity":"Bluetooth 5.3","water_resistance":"IPX5","driver":"11mm dynamic"}'
),
(
    'b3000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000005',
    '20000mAh Power Bank',
    '20000mah-power-bank',
    'Slim 20000mAh power bank with dual USB-C and USB-A output. Charges phones 4–5 times.',
    39.99, 54.99, 120, 'PB-20K',
    '{"capacity":"20000mAh","output":"2x USB-C (20W), 1x USB-A (18W)","input":"USB-C 20W","weight":"445g","charges":"4-5 phone charges"}'
),
(
    'b3000000-0000-0000-0000-000000000003',
    'a2000000-0000-0000-0000-000000000006',
    'Laptop Backpack 15.6"',
    'laptop-backpack-15-6',
    'Water-resistant laptop backpack with USB charging port and anti-theft pocket.',
    44.99, 59.99, 90, 'BP-156-PRO',
    '{"fits":"Up to 15.6\" laptop","material":"Water-resistant nylon","usb":"External USB-A charging port","compartments":"3 main + multiple pockets","weight":"0.9kg"}'
),
(
    'b3000000-0000-0000-0000-000000000004',
    'a2000000-0000-0000-0000-000000000005',
    'USB-C to Lightning Cable 2m',
    'usb-c-lightning-cable-2m',
    'MFi-certified braided cable for fast charging all Apple devices. 2-metre length.',
    14.99, 19.99, 200, 'CB-UCL2M',
    '{"length":"2 metres","connector_1":"USB-C","connector_2":"Lightning","certification":"Apple MFi","material":"Braided nylon","max_power":"30W"}'
);

INSERT INTO product_images (product_id, url, is_primary, sort_order) VALUES
('b3000000-0000-0000-0000-000000000001',
 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80',
 true, 1),
('b3000000-0000-0000-0000-000000000002',
 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?auto=format&fit=crop&w=800&q=80',
 true, 1),
('b3000000-0000-0000-0000-000000000003',
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
 true, 1),
('b3000000-0000-0000-0000-000000000004',
 'https://images.unsplash.com/photo-1586810724476-c294fb7ac01b?auto=format&fit=crop&w=800&q=80',
 true, 1);

-- ─── Telecom Gadgets ──────────────────────────────────────────────────────────

INSERT INTO products (id, category_id, name, slug, description, price, compare_price, stock_qty, sku, specs)
VALUES
(
    'b4000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000004',
    'TP-Link 4G LTE Router',
    'tp-link-4g-lte-router',
    'Plug-and-play 4G LTE router. Insert SIM and share internet with up to 32 devices.',
    89.99, 109.99, 35, 'TP-4GLTE',
    '{"connectivity":"4G LTE Cat4","wifi":"AC1200 Dual Band","max_devices":32,"ports":"1x LAN, 1x WAN","sim":"Nano SIM","antennas":"4 external"}'
),
(
    'b4000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000004',
    'WiFi Range Extender AC1200',
    'wifi-range-extender-ac1200',
    'Dual-band WiFi extender that eliminates dead zones. Works with any router.',
    34.99, 44.99, 55, 'WE-AC1200',
    '{"wifi_standard":"AC1200 Dual Band","bands":"2.4GHz (300Mbps) + 5GHz (867Mbps)","coverage":"200 sq m","ports":"1x Ethernet","setup":"WPS one-button"}'
);

INSERT INTO product_images (product_id, url, is_primary, sort_order) VALUES
('b4000000-0000-0000-0000-000000000001',
 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80',
 true, 1),
('b4000000-0000-0000-0000-000000000002',
 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
 true, 1);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM product_images;
DELETE FROM products WHERE id IN (
    'b1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000003',
    'b2000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000003','b2000000-0000-0000-0000-000000000004',
    'b3000000-0000-0000-0000-000000000001','b3000000-0000-0000-0000-000000000002','b3000000-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000004',
    'b4000000-0000-0000-0000-000000000001','b4000000-0000-0000-0000-000000000002'
);
-- +goose StatementEnd
