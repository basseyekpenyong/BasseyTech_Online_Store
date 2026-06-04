import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Wrench, Code, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ProductCard } from "@/components/products/ProductCard";
import api from "@/lib/api";
import type { PaginatedResponse, Product, Category } from "@/types";

export default function HomePage() {
  const { data: products, isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["products", "featured"],
    queryFn: () => api.get("/products?limit=8").then((r) => r.data),
  });
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  const topCategories = categories?.filter((c) => !c.parent_id).slice(0, 5) ?? [];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-blue-700 text-white">
        <div className="container py-20 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Tech for Everyone,<br className="hidden sm:block" /> Everywhere
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Buy laptops, phones & accessories. Book repairs, software development, and maintenance services — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/products">Shop Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white bg-transparent hover:bg-white/10 hover:text-white" asChild>
              <Link to="/services">Our Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      {(categoriesLoading || topCategories.length > 0) && (
        <section className="container">
          <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categoriesLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center p-4 gap-2">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              : topCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.slug}`}
                    className="flex flex-col items-center p-4 rounded-lg border hover:border-primary hover:shadow-sm transition-all text-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                      {cat.image_url ? <img src={cat.image_url} alt={cat.name} loading="lazy" className="w-8 h-8 object-contain" /> : "📦"}
                    </div>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </Link>
                ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Button variant="ghost" asChild><Link to="/products">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        {productsError ? (
          <ErrorState message="Failed to load products." onRetry={refetchProducts} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productsLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : products?.data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Services strip */}
      <section className="bg-muted/50">
        <div className="container py-12">
          <h2 className="text-2xl font-bold text-center mb-8">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Wrench, title: "Hardware Repair", desc: "Fast, professional repair for all devices — phones, laptops, accessories." },
              { icon: Code, title: "Software Development", desc: "Custom websites and apps built for businesses around the world." },
              { icon: Shield, title: "Maintenance & Support", desc: "Ongoing tech support, updates, and monitoring to keep you running." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild><Link to="/services">Book a Service</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
