import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Suspense, lazy } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute, AdminRoute } from "@/components/auth/ProtectedRoute";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const AppointmentsPage = lazy(() => import("@/pages/AppointmentsPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminAppointments = lazy(() => import("@/pages/admin/AdminAppointments"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminServices = lazy(() => import("@/pages/admin/AdminServices"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const OrderDetailPage = lazy(() => import("@/pages/OrderDetailPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ChatWidget />
      <main className="flex-1">
        <Suspense fallback={<div className="flex justify-center py-20 text-muted-foreground">Loading…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/appointments/new" element={<AppointmentsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Suspense fallback={null}><AdminDashboard /></Suspense>} />
              <Route path="products" element={<Suspense fallback={null}><AdminProducts /></Suspense>} />
              <Route path="orders" element={<Suspense fallback={null}><AdminOrders /></Suspense>} />
              <Route path="appointments" element={<Suspense fallback={null}><AdminAppointments /></Suspense>} />
              <Route path="services" element={<Suspense fallback={null}><AdminServices /></Suspense>} />
              <Route path="users" element={<Suspense fallback={null}><AdminUsers /></Suspense>} />
            </Route>
          </Route>
          <Route path="*" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
