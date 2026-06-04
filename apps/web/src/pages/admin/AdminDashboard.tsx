import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingBag, Calendar, Users, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get("/admin/dashboard/stats").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const statCards = stats ? [
    { title: "Total Revenue", value: formatPrice(stats.revenue.total), icon: DollarSign, sub: `${formatPrice(stats.revenue.pending)} pending` },
    { title: "Orders", value: stats.orders.total, icon: ShoppingBag, sub: `${stats.orders.pending} pending` },
    { title: "Appointments", value: stats.appointments.total, icon: Calendar, sub: `${stats.appointments.pending} pending` },
    { title: "Customers", value: stats.users, icon: Users, sub: "total accounts" },
    { title: "Products", value: stats.products, icon: Package, sub: "in catalogue" },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : statCards.map(({ title, value, icon: Icon, sub }) => (
            <Card key={title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
