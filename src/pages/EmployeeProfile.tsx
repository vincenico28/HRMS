import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Building2, Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEmployees, useAttendance, useLeaveRequests } from "@/hooks/useSupabaseData";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  on_leave: "bg-warning/10 text-warning",
  terminated: "bg-destructive/10 text-destructive",
};

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: employees, isLoading: empLoading } = useEmployees();
  const { data: attendance } = useAttendance();
  const { data: leaves } = useLeaveRequests();

  const employee = employees?.find((e) => e.id === id);
  const empAttendance = attendance?.filter((a) => a.employee_id === id)?.slice(0, 10) || [];
  const empLeaves = leaves?.filter((l) => l.employee_id === id)?.slice(0, 10) || [];

  if (empLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Employee not found</p>
        <Link to="/employees"><Button variant="outline" className="mt-4">Back to Employees</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/employees">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </Button>
      </Link>

      {/* Header Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {employee.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-heading font-bold text-foreground">{employee.full_name}</h1>
              <Badge variant="secondary" className={`border-0 capitalize ${statusColors[employee.status]}`}>
                {employee.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{employee.position}</p>
            <p className="text-xs text-muted-foreground font-mono">{employee.employee_id}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" /> <span className="truncate">{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0" /> {employee.phone}
                </div>
              )}
              {employee.departments?.name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4 shrink-0" /> {employee.departments.name}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" /> Hired {new Date(employee.date_hired).toLocaleDateString()}
              </div>
              {employee.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-full">
                  <MapPin className="w-4 h-4 shrink-0" /> {employee.address}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Recent Attendance</h2>
          {empAttendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records</p>
          ) : (
            <div className="space-y-2">
              {empAttendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-card-foreground">{new Date(a.date).toLocaleDateString()}</span>
                  <Badge variant="secondary" className="capitalize border-0">{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave History */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Leave History</h2>
          {empLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests</p>
          ) : (
            <div className="space-y-2">
              {empLeaves.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-card-foreground capitalize">{l.leave_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(l.start_date).toLocaleDateString()} – {new Date(l.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className={`capitalize border-0 ${
                    l.status === "approved" ? "bg-success/10 text-success" :
                    l.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning"
                  }`}>{l.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
