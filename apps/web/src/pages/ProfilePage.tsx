import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const addressSchema = z.object({
  street: z.string().min(1, "Street required"),
  city: z.string().min(1, "City required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country required"),
  zip_code: z.string().optional(),
});
type AddressForm = z.infer<typeof addressSchema>;

interface Address {
  id: string;
  street: string;
  city: string;
  state: string | null;
  country: string;
  zip_code: string | null;
  is_default: boolean;
}

export default function ProfilePage() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();

  const { data: addresses, isLoading } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: () => api.get("/addresses").then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  const addAddress = useMutation({
    mutationFn: (data: AddressForm) => api.post("/addresses", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address saved");
      reset();
    },
    onError: () => toast.error("Failed to save address"),
  });

  return (
    <div className="container py-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user?.first_name} {user?.last_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant={user?.role === "admin" ? "default" : "secondary"} className="capitalize">
              {user?.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Saved Addresses</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : addresses?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
        ) : (
          <div className="space-y-2">
            {addresses?.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-4 flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <p>{a.street}</p>
                    <p className="text-muted-foreground">
                      {[a.city, a.state, a.zip_code, a.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  {a.is_default && <Badge variant="outline" className="text-xs">Default</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />Add Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => addAddress.mutate(d))} className="space-y-4">
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
                <Input {...register("country")} placeholder="NG" />
                {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>ZIP / Postal Code</Label>
                <Input {...register("zip_code")} />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Address"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
