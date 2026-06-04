import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import type { CartItem } from "@/types";

const schema = z.object({
  street: z.string().min(1, "Street required"),
  city: z.string().min(1, "City required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country required"),
  zip_code: z.string().optional(),
});
type AddressForm = z.infer<typeof schema>;

type PaymentMethod = "stripe" | "paypal" | "cod";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cod");

  const { data: cart } = useQuery<CartItem[]>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddressForm>({
    resolver: zodResolver(schema),
  });

  const subtotal = cart?.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;
  const shipping = subtotal > 0 && subtotal < 100 ? 9.99 : 0;
  const total = subtotal + shipping;

  const placeOrder = useMutation({
    mutationFn: async (address: AddressForm) => {
      // Save address first, then place order
      const { data: addrData } = await api.post("/addresses", { ...address, is_default: true });
      const { data: order } = await api.post("/orders", {
        address_id: addrData.id,
        payment_method: payMethod,
        notes: "",
      });
      return order;
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed successfully!");
      navigate(`/orders/${order.order_id}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? "Failed to place order"),
  });

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <form onSubmit={handleSubmit((d) => placeOrder.mutate(d))}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: address + payment */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Delivery Address</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Street Address</Label>
                  <Input {...register("street")} placeholder="123 Main St" />
                  {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>City</Label>
                    <Input {...register("city")} />
                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>State / Province</Label>
                    <Input {...register("state")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Country</Label>
                    <Input {...register("country")} placeholder="US" />
                    {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>ZIP / Postal Code</Label>
                    <Input {...register("zip_code")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(["cod", "stripe", "paypal"] as PaymentMethod[]).map((m) => (
                  <label key={m} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${payMethod === m ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                    <input type="radio" name="payment" value={m} checked={payMethod === m} onChange={() => setPayMethod(m)} className="accent-primary" />
                    <span className="font-medium capitalize">
                      {m === "cod" ? "Cash on Delivery" : m === "stripe" ? "Credit / Debit Card (Stripe)" : "PayPal"}
                    </span>
                  </label>
                ))}
                {payMethod === "stripe" && (
                  <p className="text-xs text-muted-foreground pt-1">Card details will be collected securely on the next step after your order is created.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: summary */}
          <div className="border rounded-lg p-6 h-fit space-y-4">
            <h2 className="font-semibold">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {cart?.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="truncate max-w-[160px]">{i.product_name} ×{i.quantity}</span>
                  <span>{formatPrice(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !cart?.length}>
              {isSubmitting ? "Placing order…" : "Place Order"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
