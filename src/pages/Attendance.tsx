import { Search, Loader2, Plus, Clock, FileText, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  useAttendance,
  useEmployees,
  useCreateAttendance,
  useOvertimeRequests,
  useCreateOvertimeRequest,
  useUpdateOvertimeRequest,
  useTimeLogs,
  useCreateTimeLog,
  useAttendanceSummary
} from "@/hooks/useSupabaseData";
import { useState } from "react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const statusColors: Record<string, string> = {
  present: "bg-success/10 text-success",
  late: "bg-warning/10 text-warning",
  absent: "bg-destructive/10 text-destructive",
  half_day: "bg-info/10 text-info",
  late_and_undertime: "bg-orange/10 text-orange-600",
  undertime: "bg-yellow/10 text-yellow-600",
};

const overtimeStatusColors: Record<string, string> = {
  pending: "bg-yellow/10 text-yellow-600",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const defaultAttendanceForm = { employee_id: "", date: new Date().toISOString().split("T")[0], time_in: "", time_out: "", status: "present" };
const defaultOvertimeForm = { employee_id: "", date: new Date().toISOString().split("T")[0], start_time: "", end_time: "", hours: 0, reason: "" };

export default function Attendance() {
  const { data: records, isLoading } = useAttendance();
  const { data: employees = [] } = useEmployees();
  const { data: overtimeRequests = [] } = useOvertimeRequests();
  const { data: timeLogs = [] } = useTimeLogs();
  const createAttendance = useCreateAttendance();
  const createOvertimeRequest = useCreateOvertimeRequest();
  const updateOvertimeRequest = useUpdateOvertimeRequest();
  const createTimeLog = useCreateTimeLog();
  const { data: attendanceSummary } = useAttendanceSummary();

  const [search, setSearch] = useState("");
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState(defaultAttendanceForm);
  const [overtimeForm, setOvertimeForm] = useState(defaultOvertimeForm);
  const [reportPeriod, setReportPeriod] = useState("monthly");

  const { data: userRole } = useUserRole();
  const isAdmin = userRole === "admin";
  const isHR = userRole === "hr_manager";

  const filtered = records?.filter((r) =>
    r.employees?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (t: string | null) => {
    if (!t) return "—";
    const literalDateTime = t.substring(0, 19);
    return new Date(literalDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceForm.employee_id) { toast.error("Please select an employee"); return; }
    createAttendance.mutate(
      {
        employee_id: attendanceForm.employee_id,
        date: attendanceForm.date,
        time_in: attendanceForm.time_in ? `${attendanceForm.date}T${attendanceForm.time_in}:00` : undefined,
        time_out: attendanceForm.time_out ? `${attendanceForm.date}T${attendanceForm.time_out}:00` : undefined,
        status: attendanceForm.status,
      },
      {
        onSuccess: () => { toast.success("Attendance recorded"); setAttendanceDialogOpen(false); setAttendanceForm(defaultAttendanceForm); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleOvertimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overtimeForm.employee_id) { toast.error("Please select an employee"); return; }
    if (overtimeForm.hours <= 0) { toast.error("Please enter valid overtime hours"); return; }

    createOvertimeRequest.mutate(
      {
        employee_id: overtimeForm.employee_id,
        date: overtimeForm.date,
        start_time: overtimeForm.start_time,
        end_time: overtimeForm.end_time,
        hours: overtimeForm.hours,
        reason: overtimeForm.reason,
      },
      {
        onSuccess: () => { toast.success("Overtime request submitted"); setOvertimeDialogOpen(false); setOvertimeForm(defaultOvertimeForm); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleTimeClock = (type: "in" | "out") => {
    // In a real app, you'd get the current user/employee ID from auth context
    // For now, we'll use the first employee as an example
    const currentEmployeeId = employees[0]?.id;
    if (!currentEmployeeId) {
      toast.error("No employee found");
      return;
    }

    createTimeLog.mutate(
      { employee_id: currentEmployeeId, type },
      {
        onSuccess: () => toast.success(`Time ${type} recorded`),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleOvertimeAction = (id: string, status: "approved" | "rejected") => {
    updateOvertimeRequest.mutate(
      { id, status, reviewed_at: new Date().toISOString() },
      {
        onSuccess: () => toast.success(`Overtime request ${status}`),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Attendance & Time Tracking</h1>
          <p className="text-muted-foreground mt-1">Manage daily attendance, time logs, and overtime requests</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time-clock">Time Clock</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by employee..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Dialog open={attendanceDialogOpen} onOpenChange={(open) => { setAttendanceDialogOpen(open); if (!open) setAttendanceForm(defaultAttendanceForm); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Record Attendance</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
                <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Employee *</Label>
                    <Select value={attendanceForm.employee_id} onValueChange={(val) => setAttendanceForm(f => ({ ...f, employee_id: val }))}>
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
                    <Input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Time In</Label>
                      <Input type="time" value={attendanceForm.time_in} onChange={(e) => setAttendanceForm(f => ({ ...f, time_in: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Time Out</Label>
                      <Input type="time" value={attendanceForm.time_out} onChange={(e) => setAttendanceForm(f => ({ ...f, time_out: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={attendanceForm.status} onValueChange={(val) => setAttendanceForm(f => ({ ...f, status: val }))}>
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
        </TabsContent>

        <TabsContent value="time-clock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time Clock
              </CardTitle>
              <CardDescription>Record your daily time in and out</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={() => handleTimeClock("in")} className="flex-1">
                  <Clock className="w-4 h-4 mr-2" />
                  Time In
                </Button>
                <Button onClick={() => handleTimeClock("out")} variant="outline" className="flex-1">
                  <Clock className="w-4 h-4 mr-2" />
                  Time Out
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Recent Time Logs</h3>
                <div className="space-y-2">
                  {timeLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={log.type === "in" ? "default" : "secondary"}>
                          {log.type.toUpperCase()}
                        </Badge>
                        <span className="text-sm">{log.employees?.full_name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.time_stamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {timeLogs.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No time logs found</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Overtime Requests</h2>
            <Dialog open={overtimeDialogOpen} onOpenChange={(open) => { setOvertimeDialogOpen(open); if (!open) setOvertimeForm(defaultOvertimeForm); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Request Overtime</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Request Overtime</DialogTitle></DialogHeader>
                <form onSubmit={handleOvertimeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Employee *</Label>
                    <Select value={overtimeForm.employee_id} onValueChange={(val) => setOvertimeForm(f => ({ ...f, employee_id: val }))}>
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
                    <Input type="date" value={overtimeForm.date} onChange={(e) => setOvertimeForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input type="time" value={overtimeForm.start_time} onChange={(e) => setOvertimeForm(f => ({ ...f, start_time: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input type="time" value={overtimeForm.end_time} onChange={(e) => setOvertimeForm(f => ({ ...f, end_time: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Hours</Label>
                    <Input type="number" step="0.5" min="0" value={overtimeForm.hours} onChange={(e) => setOvertimeForm(f => ({ ...f, hours: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea value={overtimeForm.reason} onChange={(e) => setOvertimeForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for overtime..." />
                  </div>
                  <Button type="submit" className="w-full" disabled={createOvertimeRequest.isPending}>
                    {createOvertimeRequest.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {overtimeRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{request.employees?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.date} • {request.start_time} - {request.end_time} • {request.hours} hours
                      </p>
                      {request.reason && <p className="text-sm">{request.reason}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={overtimeStatusColors[request.status]}>
                        {request.status}
                      </Badge>
                      {(isAdmin || isHR) && request.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleOvertimeAction(request.id, "approved")}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleOvertimeAction(request.id, "rejected")}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {overtimeRequests.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No overtime requests found</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Attendance Reports
              </CardTitle>
              <CardDescription>View attendance summaries and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {attendanceSummary?.slice(0, 20).map((summary) => (
                  <div key={`${summary.employee_id}-${summary.date}`} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{summary.employee_name}</p>
                      <p className="text-sm text-muted-foreground">{summary.date}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p>Hours: {summary.total_hours.toFixed(1)}</p>
                        {summary.late_minutes > 0 && <p className="text-warning">Late: {summary.late_minutes}m</p>}
                        {summary.undertime_minutes > 0 && <p className="text-orange-600">Undertime: {summary.undertime_minutes}m</p>}
                        {summary.overtime_hours > 0 && <p className="text-success">OT: {summary.overtime_hours.toFixed(1)}h</p>}
                      </div>
                      <Badge variant="secondary" className={`border-0 capitalize ${statusColors[summary.status] || 'bg-gray/10 text-gray'}`}>
                        {summary.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!attendanceSummary || attendanceSummary.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No attendance data found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
