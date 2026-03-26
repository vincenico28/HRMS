import { useState } from "react";
import { Plus, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeaveRequests, useCreateLeaveRequest, useUpdateLeaveRequest, useEmployees } from "@/hooks/useSupabaseData";
import { useLogActivity } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export default function Leave() {
  const { data: leaves, isLoading } = useLeaveRequests();
  const { data: employees } = useEmployees();
  const createLeave = useCreateLeaveRequest();
  const updateLeave = useUpdateLeaveRequest();
  const logActivity = useLogActivity();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    leave_type: "sick" as string,
    start_date: "",
    end_date: "",
    reason: "",
  });

  const handleCreate = async () => {
    try {
      await createLeave.mutateAsync(form);
      logActivity.mutate({ action: "Created leave request", details: { leave_type: form.leave_type } });
      toast({ title: "Leave request submitted" });
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateLeave.mutateAsync({ id, status, reviewed_at: new Date().toISOString() });
      logActivity.mutate({ action: `${status} leave request`, details: { id } });
      toast({ title: `Leave ${status}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Manage leave requests and approvals</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => {
          setForm({ employee_id: "", leave_type: "sick", start_date: "", end_date: "", reason: "" });
          setDialogOpen(true);
        }}>
          <Plus className="w-4 h-4" /> Apply for Leave
        </Button>
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">From</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">To</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves?.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No leave requests found</td></tr>
                )}
                {leaves?.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{l.employees?.full_name || "Unknown"}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{l.leave_type}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{l.start_date}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{l.end_date}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={`border-0 capitalize ${statusColors[l.status]}`}>{l.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {l.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-success hover:bg-success/10" onClick={() => handleAction(l.id, "approved")}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleAction(l.id, "rejected")}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for leave..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createLeave.isPending}>
              {createLeave.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
