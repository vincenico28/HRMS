import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Clock, CalendarDays, GraduationCap, Megaphone, CheckCircle2, XCircle, AlertCircle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

function useMyEmployeeProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_employee_profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, departments(name)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function useMyAttendance(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["my_attendance", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", employeeId!)
        .order("date", { ascending: false })
        .limit(7);
      if (error) throw error;
      return data;
    },
  });
}

function useMyLeaves(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["my_leaves", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("employee_id", employeeId!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });
}

function useMyEnrollments(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["my_enrollments", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_enrollments")
        .select("*, training_programs(title, category, status)")
        .eq("employee_id", employeeId!)
        .order("enrolled_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });
}

function useRecentAnnouncements() {
  return useQuery({
    queryKey: ["recent_announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });
}

const statusIcon = (status: string) => {
  switch (status) {
    case "approved": case "present": case "completed": return <CheckCircle2 className="w-4 h-4 text-success" />;
    case "rejected": case "absent": return <XCircle className="w-4 h-4 text-destructive" />;
    default: return <AlertCircle className="w-4 h-4 text-warning" />;
  }
};

export default function EmployeeDashboard() {
  const { data: profile, isLoading: profileLoading } = useMyEmployeeProfile();
  const { data: attendance } = useMyAttendance(profile?.id);
  const { data: leaves } = useMyLeaves(profile?.id);
  const { data: enrollments } = useMyEnrollments(profile?.id);
  const { data: announcements } = useRecentAnnouncements();

  if (profileLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const todayAttendance = attendance?.find(
    (a) => a.date === new Date().toISOString().split("T")[0]
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            Welcome back, {profile?.full_name ?? "Employee"}!
          </h1>
          <p className="text-muted-foreground">
            {profile?.position}{profile?.departments?.name ? ` · ${profile.departments.name}` : ""}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Status</p>
              <p className="text-lg font-semibold capitalize">
                {todayAttendance?.status ?? "Not Recorded"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-warning/10">
              <CalendarDays className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Leaves</p>
              <p className="text-lg font-semibold">
                {leaves?.filter((l) => l.status === "pending").length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-info/10">
              <GraduationCap className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Training</p>
              <p className="text-lg font-semibold">
                {enrollments?.filter((e) => e.status === "enrolled").length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-accent/50">
              <Megaphone className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Announcements</p>
              <p className="text-lg font-semibold">{announcements?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5" /> Recent Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!attendance?.length ? (
              <p className="text-muted-foreground text-sm">No attendance records yet.</p>
            ) : (
              <div className="space-y-3">
                {attendance.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      {statusIcon(a.status)}
                      <span className="text-sm font-medium">{format(new Date(a.date), "EEE, MMM d")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {a.time_in && <span>In: {format(new Date(a.time_in.substring(0, 19)), "h:mm a")}</span>}
                      {a.time_out && <span>Out: {format(new Date(a.time_out.substring(0, 19)), "h:mm a")}</span>}
                      <Badge variant={a.status === "present" ? "default" : "secondary"} className="capitalize text-xs">
                        {a.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="w-5 h-5" /> My Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!leaves?.length ? (
              <p className="text-muted-foreground text-sm">No leave requests yet.</p>
            ) : (
              <div className="space-y-3">
                {leaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      {statusIcon(l.status)}
                      <div>
                        <span className="text-sm font-medium capitalize">{l.leave_type}</span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(l.start_date), "MMM d")} – {format(new Date(l.end_date), "MMM d")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}
                      className="capitalize text-xs"
                    >
                      {l.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="w-5 h-5" /> My Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!enrollments?.length ? (
              <p className="text-muted-foreground text-sm">No training enrollments yet.</p>
            ) : (
              <div className="space-y-3">
                {enrollments.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{e.training_programs?.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{e.training_programs?.category}</p>
                    </div>
                    <Badge variant={e.status === "completed" ? "default" : "secondary"} className="capitalize text-xs">
                      {e.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="w-5 h-5" /> Latest Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!announcements?.length ? (
              <p className="text-muted-foreground text-sm">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{a.title}</p>
                      {a.is_pinned && <Badge variant="outline" className="text-xs">Pinned</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(a.created_at), "MMM d, yyyy")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
