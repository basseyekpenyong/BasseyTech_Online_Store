import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function OrdersPage() {
  const { data: orders, isLoading, isError, refetch } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => api.get("/orders").then((r) => r.data),
  });

  if (isLoading) return (
    <div className="container py-8 max-w-2xl space-y-4">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
    </div>
  );

  if (isError) return (
    <div className="container py-8 max-w-2xl">
      <ErrorState message="Failed to load orders." onRetry={refetch} />
    </div>
  );

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {!orders?.length ? (
        <div className="text-center py-20 space-y-3">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          <Button asChild><Link to="/products">Shop now</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="font-semibold">{formatPrice(o.total)}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant[o.status] ?? "default"}>{o.status}</Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/orders/${o.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
