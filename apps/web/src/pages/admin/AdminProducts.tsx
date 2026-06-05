import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Plus, Pencil, Trash2, Upload, Star, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";

interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

function ImageManager({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading } = useQuery<ProductImage[]>({
    queryKey: ["admin", "product-images", productId],
    queryFn: () => api.get(`/admin/products/${productId}/images`).then((r) => r.data),
  });

  const upload = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      return api.post(`/admin/products/${productId}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "product-images", productId] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Image uploaded");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Upload failed"),
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => api.delete(`/admin/products/${productId}/images/${imageId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "product-images", productId] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Image removed");
    },
  });

  const setPrimary = useMutation({
    mutationFn: (imageId: string) => api.put(`/admin/products/${productId}/images/${imageId}/primary`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "product-images", productId] });
      toast.success("Primary image updated");
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Product Images</p>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}>
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          {upload.isPending ? "Uploading…" : "Upload Image"}
        </Button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
          className="hidden" onChange={handleFile} />
      </div>

      {isLoading ? (
        <div className="flex gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-20 rounded" />)}</div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2 border rounded-lg text-muted-foreground text-sm">
          <ImageIcon className="h-8 w-8" />
          <p>No images yet — upload one above</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.url} alt="" className="h-20 w-20 object-cover rounded border" />
              {img.is_primary && (
                <span className="absolute top-0.5 left-0.5 bg-primary rounded-full p-0.5">
                  <Star className="h-2.5 w-2.5 text-white fill-white" />
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                {!img.is_primary && (
                  <button onClick={() => setPrimary.mutate(img.id)}
                    className="bg-white/20 hover:bg-white/40 rounded p-1" title="Set as primary">
                    <Star className="h-3 w-3 text-white" />
                  </button>
                )}
                <button onClick={() => remove.mutate(img.id)}
                  className="bg-white/20 hover:bg-red-500/80 rounded p-1" title="Delete">
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP — max 10 MB. Star = primary image shown in listings.</p>
    </div>
  );
}

export default function AdminProducts() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", price: "", stock_qty: "", category_id: "", sku: "" });

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api.get("/admin/products").then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
  });

  const save = useMutation({
    mutationFn: () => editId
      ? api.put(`/admin/products/${editId}`, { ...form, price: parseFloat(form.price), stock_qty: parseInt(form.stock_qty), is_active: true })
      : api.post("/admin/products", { ...form, price: parseFloat(form.price), stock_qty: parseInt(form.stock_qty) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success(editId ? "Product updated" : "Product created");
      setShowForm(false); setEditId(null);
      setForm({ name: "", slug: "", price: "", stock_qty: "", category_id: "", sku: "" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "products"] }); toast.success("Deleted"); },
  });

  const startEdit = (p: any) => {
    setForm({ name: p.name, slug: p.slug, price: String(p.price), stock_qty: String(p.stock_qty), category_id: "", sku: p.sku ?? "" });
    setEditId(p.id); setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          <Plus className="mr-2 h-4 w-4" />{showForm ? "Cancel" : "Add Product"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editId ? "Edit Product" : "New Product"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Name", key: "name" }, { label: "Slug", key: "slug" },
                { label: "Price ($)", key: "price", type: "number" }, { label: "Stock Qty", key: "stock_qty", type: "number" },
                { label: "SKU", key: "sku" },
              ].map(({ label, key, type }) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input type={type ?? "text"} value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="space-y-1">
                <Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
                  <option value="">Select…</option>
                  {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save Product"}
                </Button>
              </div>
            </div>

            {editId && (
              <>
                <Separator />
                <ImageManager productId={editId} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.images?.[0]?.url
                      ? <img src={p.images[0].url} alt={p.name} className="h-10 w-10 object-cover rounded border" />
                      : <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center text-lg">📦</div>}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.category_name}</TableCell>
                  <TableCell>{formatPrice(p.price)}</TableCell>
                  <TableCell>{p.stock_qty}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(p)}
                        title="Edit product & manage images">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                        onClick={() => { if (confirm("Delete product?")) del.mutate(p.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
