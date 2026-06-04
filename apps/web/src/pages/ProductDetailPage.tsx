import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingCart, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedImg, setSelectedImg] = useState(0);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: () => api.get(`/products/${slug}`).then((r) => r.data),
  });

  const addToCart = useMutation({
    mutationFn: () => api.post("/cart/items", { product_id: product!.id, quantity: 1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cart"] }); toast.success("Added to cart"); },
    onError: () => toast.error("Failed to add to cart"),
  });

  if (isLoading) return (
    <div className="container py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/4" /><Skeleton className="h-32 w-full" /></div>
    </div>
  );

  if (!product) return <div className="container py-20 text-center text-muted-foreground">Product not found.</div>;

  const primaryImg = product.images[selectedImg] ?? product.images.find((i) => i.is_primary);

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {primaryImg
              ? <img src={primaryImg.url} alt={product.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button key={img.id} onClick={() => setSelectedImg(idx)}
                  className={`w-16 h-16 flex-shrink-0 rounded border-2 overflow-hidden ${idx === selectedImg ? "border-primary" : "border-transparent"}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{product.category_name}</p>
            <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
            {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
            {product.compare_price && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
            )}
            {product.compare_price && (
              <Badge variant="destructive" className="text-xs">
                {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
              </Badge>
            )}
          </div>

          {product.stock_qty > 0
            ? <p className="text-sm text-green-600 font-medium">{product.stock_qty} in stock</p>
            : <Badge variant="secondary">Out of stock</Badge>}

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <Button size="lg" className="w-full sm:w-auto"
            disabled={product.stock_qty === 0 || addToCart.isPending}
            onClick={() => { if (!user) { navigate("/login"); return; } addToCart.mutate(); }}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            {addToCart.isPending ? "Adding…" : "Add to Cart"}
          </Button>

          {/* Specs */}
          {Object.keys(product.specs).length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="font-semibold mb-3">Specifications</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                      <dt className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
