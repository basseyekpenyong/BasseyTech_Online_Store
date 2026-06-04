import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatPrice, formatDate } from "@/lib/utils";
import api from "@/lib/api";
import type { Order } from "@/types";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  shipped: "default",
  delivered: "outline",
  cancelled: "destructive",
};

const paymentStatusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  paid: "default",
  failed: "destructive",
};

const paymentMethodLabel: Record<string, string> = {
  stripe: "Card (Stripe)",
  paypal: "PayPal",
  cod: "Cash on Delivery",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading, isError, refetch } = useQuery<Order>({
    queryKey: ["orders", id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="container py-8 max-w-2xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48" />
      <Skeleton className="h-32" />
    </div>
  );

  if (isError || !order) return (
    <div className="container py-8 max-w-2xl">
      <ErrorState message="Order not found." onRetry={refetch} />
    </div>
  );

  return (
    <div className="container py-8 max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/orders"><ArrowLeft className="h-4 w-4 mr-1" />Back to Orders</Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[order.status] ?? "default"}>{order.status}</Badge>
          <Badge variant={paymentStatusVariant[order.payment_status] ?? "default"}>
            {order.payment_status}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent className="divide-y p-0">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between px-6 py-3 text-sm">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-muted-foreground">
                  {formatPrice(item.unit_price)} × {item.quantity}
                </p>
              </div>
              <span className="font-semibold">{formatPrice(item.unit_price * item.quantity)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{order.shipping_fee === 0 ? "Free" : formatPrice(order.shipping_fee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment method</span>
            <span>{paymentMethodLabel[order.payment_method] ?? order.payment_method}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span><span>{formatPrice(order.total)}</span>
          </div>
          {order.notes && (
            <p className="pt-2 text-muted-foreground">
              <span className="font-medium text-foreground">Notes: </span>{order.notes}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
