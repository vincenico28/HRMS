import { Search, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAttendance, useCreateAttendance, useEmployees } from "@/hooks/useSupabaseData";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  present: "bg-success/10 text-success",
  late: "bg-warning/10 text-warning",
  absent: "bg-destructive/10 text-destructive",
  half_day: "bg-info/10 text-info",
};

const defaultForm = { employee_id: "", date: new Date().toISOString().split("T")[0], time_in: "", time_out: "", status: "present" };

export default function Attendance() {
  const { data: records, isLoading } = useAttendance();
  const { data: employees = [] } = useEmployees();
  const createAttendance = useCreateAttendance();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const filtered = records?.filter((r) =>
    r.employees?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (t: string | null) => {
    if (!t) return "—";
    const literalDateTime = t.substring(0, 19);
    return new Date(literalDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id) { toast.error("Please select an employee"); return; }
    createAttendance.mutate(
      {
        employee_id: form.employee_id,
        date: form.date,
        time_in: form.time_in ? `${form.date}T${form.time_in}:00` : undefined,
        time_out: form.time_out ? `${form.date}T${form.time_out}:00` : undefined,
        status: form.status,
      },
      {
        onSuccess: () => { toast.success("Attendance recorded"); setDialogOpen(false); setForm(defaultForm); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track daily attendance records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setForm(defaultForm); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Record Attendance</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <Select value={form.employee_id} onValueChange={(val) => setForm(f => ({ ...f, employee_id: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Time In</Label>
                  <Input type="time" value={form.time_in} onChange={(e) => setForm(f => ({ ...f, time_in: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Time Out</Label>
                  <Input type="time" value={form.time_out} onChange={(e) => setForm(f => ({ ...f, time_out: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(val) => setForm(f => ({ ...f, status: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createAttendance.isPending}>
                {createAttendance.isPending ? "Recording..." : "Record Attendance"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by employee..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time In</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time Out</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No attendance records found</td></tr>
                )}
                {filtered?.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{r.employees?.full_name || "Unknown"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTime(r.time_in)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTime(r.time_out)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={`border-0 capitalize ${statusColors[r.status]}`}>
                        {r.status.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
