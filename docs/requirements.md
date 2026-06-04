# Chiba-Tech — Requirements

## 1. Functional Requirements

### 1.1 Customer-Facing

| ID | Requirement |
|---|---|
| F-01 | Customers can browse products by category and search by keyword |
| F-02 | Customers can view product detail pages with images, specs, and price |
| F-03 | Customers can add products to a cart and adjust quantities |
| F-04 | Customers must register and log in before placing an order or booking an appointment |
| F-05 | Customers can place orders and choose Stripe (card), PayPal, or Cash on Delivery |
| F-06 | Customers can view their order history and status |
| F-07 | Customers can browse services (repair, software development, maintenance) |
| F-08 | Customers can book appointments with a technician or developer |
| F-09 | Customers can view, and cancel pending appointments |
| F-10 | Customers can manage their profile and saved addresses |

### 1.2 Admin-Facing

| ID | Requirement |
|---|---|
| A-01 | Admin can create, update, and delete product listings including images and specs |
| A-02 | Admin can manage product categories (including sub-categories) |
| A-03 | Admin can view all orders and update their status |
| A-04 | Admin can manage service listings |
| A-05 | Admin can view and update appointment status (confirm, complete, cancel) |
| A-06 | Admin can manage staff profiles (linked to user accounts) |
| A-07 | Admin can view a dashboard with key stats (revenue, orders, appointments) |
| A-08 | Admin can view all customer accounts |

### 1.3 Payment

| ID | Requirement |
|---|---|
| P-01 | Stripe card payments processed via Payment Intent API |
| P-02 | PayPal payments processed via Orders API v2 |
| P-03 | Cash on Delivery orders are created with `payment_status = pending` |
| P-04 | Stripe webhook updates order `payment_status` to `paid` or `failed` |

## 2. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NF-01 | Fully responsive — works on mobile, tablet, and desktop |
| NF-02 | Supports Chrome, Firefox, Safari, and Edge (latest two versions) |
| NF-03 | API response time < 500 ms for typical list endpoints |
| NF-04 | Passwords stored as bcrypt hashes (min cost 12) |
| NF-05 | JWT access tokens expire after 15 minutes; refresh tokens after 7 days |
| NF-06 | All DB primary keys are UUIDs (v4) |
| NF-07 | HTTPS enforced in production |
| NF-08 | Admin routes are protected by role check on every request |
