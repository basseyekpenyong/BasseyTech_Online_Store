import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import type { Appointment, Service } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500",
};

const schema = z.object({
  service_id: z.string().min(1, "Select a service"),
  scheduled_date: z.string().min(1, "Select a date"),
  scheduled_time: z.string().min(1, "Select a time"),
  notes: z.string().optional(),
});
type BookForm = z.infer<typeof schema>;

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const defaultService = sp.get("service") ?? "";

  const { data: appointments, isLoading, isError, refetch } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: () => api.get("/appointments").then((r) => r.data),
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => api.get("/services").then((r) => r.data),
  });

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } = useForm<BookForm>({
    resolver: zodResolver(schema),
    defaultValues: { service_id: defaultService },
  });

  const book = useMutation({
    mutationFn: (data: BookForm) => api.post("/appointments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment booked!");
      reset();
    },
    onError: () => toast.error("Failed to book appointment"),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api.put(`/appointments/${id}/cancel`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); toast.success("Appointment cancelled"); },
  });

  return (
    <div className="container py-8 space-y-10">
      {/* Book form */}
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Book an Appointment</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => book.mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <Label>Service</Label>
              <Select defaultValue={defaultService} onValueChange={(v) => setValue("service_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                <SelectContent>
                  {services?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.service_id && <p className="text-xs text-destructive">{errors.service_id.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" {...register("scheduled_date")} min={new Date().toISOString().split("T")[0]} />
                {errors.scheduled_date && <p className="text-xs text-destructive">{errors.scheduled_date.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Time</Label>
                <Input type="time" {...register("scheduled_time")} />
                {errors.scheduled_time && <p className="text-xs text-destructive">{errors.scheduled_time.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Input placeholder="Describe your issue briefly…" {...register("notes")} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Booking…" : "Book Appointment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My appointments */}
      <div>
        <h2 className="text-xl font-bold mb-4">My Appointments</h2>
        {isError ? (
          <ErrorState message="Failed to load appointments." onRetry={refetch} />
        ) : isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        ) : appointments?.length === 0 ? (
          <p className="text-muted-foreground">No appointments yet.</p>
        ) : (
          <div className="space-y-3">
            {appointments?.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{a.service_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(a.scheduled_date)} at {a.scheduled_time}
                      {a.staff_name && ` — with ${a.staff_name}`}
                    </p>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[a.status]}`}>
                      {a.status}
                    </span>
                    {a.status === "pending" && (
                      <Button size="sm" variant="destructive" onClick={() => cancel.mutate(a.id)}>Cancel</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
