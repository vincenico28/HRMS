import { Users, UserCheck, UserPlus, CalendarDays, Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { DepartmentChart } from "@/components/DepartmentChart";
import { RecentActivity } from "@/components/RecentActivity";
import { LeaveRequestsWidget } from "@/components/LeaveRequestsWidget";
import { AttendanceOverview } from "@/components/AttendanceOverview";
import { useDashboardStats } from "@/hooks/useSupabaseData";
import { useUserRole } from "@/hooks/useUserRole";
import EmployeeDashboard from "@/pages/EmployeeDashboard";

export default function Dashboard() {
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: stats, isLoading } = useDashboardStats();

  if (roleLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (role === "employee") {
    return <EmployeeDashboard />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={stats?.totalEmployees ?? 0} change="All registered" changeType="neutral" icon={Users} />
          <StatCard title="Active Employees" value={stats?.activeEmployees ?? 0} change={stats?.totalEmployees ? `${Math.round(((stats?.activeEmployees ?? 0) / stats.totalEmployees) * 100)}% active` : "—"} changeType="positive" icon={UserCheck} iconBg="bg-success/10" />
          <StatCard title="New Hires (30d)" value={stats?.newHires ?? 0} change="Last 30 days" changeType="positive" icon={UserPlus} iconBg="bg-info/10" />
          <StatCard title="Pending Leaves" value={stats?.pendingLeaves ?? 0} change="Awaiting review" changeType={stats?.pendingLeaves ? "negative" : "neutral"} icon={CalendarDays} iconBg="bg-warning/10" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentChart />
        <AttendanceOverview />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <LeaveRequestsWidget />
      </div>
    </div>
  );
}
