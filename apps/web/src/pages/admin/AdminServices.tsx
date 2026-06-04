import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";

export default function AdminServices() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", base_price: "", is_active: true });

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: () => api.get("/admin/services").then((r) => r.data),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, base_price: form.base_price ? parseFloat(form.base_price) : null };
      return editId ? api.put(`/admin/services/${editId}`, payload) : api.post("/admin/services", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
      toast.success(editId ? "Service updated" : "Service created");
      setShowForm(false); setEditId(null);
      setForm({ name: "", slug: "", description: "", base_price: "", is_active: true });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/services/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "services"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          <Plus className="mr-2 h-4 w-4" />{showForm ? "Cancel" : "Add Service"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editId ? "Edit" : "New"} Service</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Name", key: "name" }, { label: "Slug", key: "slug" },
              { label: "Base Price ($)", key: "base_price", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input type={type ?? "text"} value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="sm:col-span-2 space-y-1">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>Save Service</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services?.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.base_price ? formatPrice(s.base_price) : "Quote-based"}</TableCell>
                  <TableCell><Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setForm({ name: s.name, slug: s.slug, description: s.description ?? "", base_price: String(s.base_price ?? ""), is_active: s.is_active }); setEditId(s.id); setShowForm(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                        onClick={() => { if (confirm("Delete?")) del.mutate(s.id); }}>
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
