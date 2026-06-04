export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "customer" | "admin";
  created_at: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  stock_qty: number;
  sku: string | null;
  specs: Record<string, string>;
  is_active: boolean;
  created_at: string;
  images: ProductImage[];
}

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  price: number;
  image_url: string | null;
  quantity: number;
  updated_at: string;
}

export interface Order {
  id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  payment_method: "stripe" | "paypal" | "cod";
  payment_status: "pending" | "paid" | "failed";
  subtotal: number;
  shipping_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number | null;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  service_id: string;
  service_name: string;
  staff_id: string | null;
  staff_name: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number };
}
