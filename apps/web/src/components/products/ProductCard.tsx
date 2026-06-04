import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import type { Product } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Props { product: Product }

export function ProductCard({ product }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0];

  const addToCart = useMutation({
    mutationFn: () => api.post("/cart/items", { product_id: product.id, quantity: 1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(`${product.name} added to cart`);
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const handleAddToCart = () => {
    if (!user) { navigate("/login"); return; }
    addToCart.mutate();
  };

  return (
    <Card className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <Link to={`/products/${product.slug}`} className="block aspect-square bg-muted overflow-hidden">
        {primaryImage ? (
          <img src={primaryImage.url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
        )}
      </Link>
      <CardContent className="flex-1 p-3">
        <p className="text-xs text-muted-foreground mb-1">{product.category_name}</p>
        <Link to={`/products/${product.slug}`} className="font-medium text-sm line-clamp-2 hover:text-primary">
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-bold text-primary">{formatPrice(product.price)}</span>
          {product.compare_price && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
          )}
        </div>
        {product.stock_qty === 0 && <Badge variant="secondary" className="mt-1 text-xs">Out of stock</Badge>}
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button
          size="sm" className="w-full" variant="outline"
          onClick={handleAddToCart}
          disabled={product.stock_qty === 0 || addToCart.isPending}
        >
          <ShoppingCart className="mr-2 h-3 w-3" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
