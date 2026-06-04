import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import type { CartItem } from "@/types";
import { useCartStore } from "@/stores/cartStore";

export default function CartPage() {
  const qc = useQueryClient();
  const setItems = useCartStore((s) => s.setItems);

  const { data: items, isLoading } = useQuery<CartItem[]>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then((r) => { setItems(r.data); return r.data; }),
  });

  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.put(`/cart/items/${id}`, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: () => toast.error("Failed to update quantity"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/cart/items/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cart"] }); toast.success("Item removed"); },
  });

  const subtotal = items?.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0;
  const shipping = subtotal > 0 && subtotal < 100 ? 9.99 : 0;
  const total = subtotal + shipping;

  if (isLoading) return (
    <div className="container py-8 max-w-2xl space-y-4">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
    </div>
  );

  if (!items || items.length === 0) return (
    <div className="container py-20 text-center space-y-4">
      <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Your cart is empty</h2>
      <Button asChild><Link to="/products">Start shopping</Link></Button>
    </div>
  );

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
              <div className="w-20 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                {item.image_url
                  ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product_slug}`} className="font-medium hover:text-primary line-clamp-1">
                  {item.product_name}
                </Link>
                <p className="text-primary font-semibold">{formatPrice(item.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="icon" variant="outline" className="h-6 w-6"
                    onClick={() => update.mutate({ id: item.id, quantity: item.quantity - 1 })}
                    disabled={item.quantity <= 1}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-6 w-6"
                    onClick={() => update.mutate({ id: item.id, quantity: item.quantity + 1 })}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                <Button size="icon" variant="ghost" className="text-destructive h-8 w-8"
                  onClick={() => remove.mutate(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border rounded-lg p-6 h-fit space-y-4">
          <h2 className="font-semibold text-lg">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            {shipping === 0 && subtotal > 0 && (
              <p className="text-xs text-green-600">Free shipping on orders over $100</p>
            )}
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span><span>{formatPrice(total)}</span>
          </div>
          <Button asChild className="w-full"><Link to="/checkout">Proceed to Checkout</Link></Button>
        </div>
      </div>
    </div>
  );
}
