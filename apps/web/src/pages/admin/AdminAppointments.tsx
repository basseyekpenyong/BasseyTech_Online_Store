import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";

const APPT_STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary", confirmed: "default", completed: "outline", cancelled: "destructive",
};

export default function AdminAppointments() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "appointments"],
    queryFn: () => api.get("/admin/appointments").then((r) => r.data),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/appointments/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "appointments"] }); toast.success("Updated"); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Appointments</h1>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="text-sm">{a.user_name}</div>
                    <div className="text-xs text-muted-foreground">{a.user_email}</div>
                  </TableCell>
                  <TableCell>{a.service_name}</TableCell>
                  <TableCell className="text-sm">{formatDate(a.scheduled_date)} at {a.scheduled_time}</TableCell>
                  <TableCell>
                    <Select value={a.status} onValueChange={(v) => update.mutate({ id: a.id, status: v })}>
                      <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {APPT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
