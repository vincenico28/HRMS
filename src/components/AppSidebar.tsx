import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarDays,
  Bell,
  Shield,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Settings,
  UserCog,
  GraduationCap,
  UserPlus,
  Megaphone,
  DollarSign,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

const allNavItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["admin", "hr_manager", "employee"] },
  { title: "Employees", path: "/employees", icon: Users, roles: ["admin", "hr_manager"] },
  { title: "Departments", path: "/departments", icon: Building2, roles: ["admin", "hr_manager"] },
  { title: "Payroll", path: "/payroll", icon: DollarSign, roles: ["admin", "hr_manager"] },
  { title: "Salary Structures", path: "/salary-structures", icon: Wallet, roles: ["admin", "hr_manager"] },
  { title: "Employee Salaries", path: "/employee-salaries", icon: DollarSign, roles: ["admin", "hr_manager"] },
  { title: "Attendance", path: "/attendance", icon: Clock, roles: ["admin", "hr_manager", "employee"] },
  { title: "Expenses", path: "/expenses", icon: Wallet, roles: ["admin", "hr_manager", "employee"] },
  { title: "Leave", path: "/leave", icon: CalendarDays, roles: ["admin", "hr_manager", "employee"] },
  { title: "Notifications", path: "/notifications", icon: Bell, roles: ["admin", "hr_manager", "employee"] },
  { title: "Activity Logs", path: "/activity-logs", icon: Shield, roles: ["admin"] },
  { title: "Documents", path: "/documents", icon: FolderOpen, roles: ["admin", "hr_manager", "employee"] },
  { title: "Training", path: "/training", icon: GraduationCap, roles: ["admin", "hr_manager", "employee"] },
  { title: "Recruitment", path: "/recruitment", icon: UserPlus, roles: ["admin", "hr_manager"] },
  { title: "Announcements", path: "/announcements", icon: Megaphone, roles: ["admin", "hr_manager", "employee"] },
  { title: "User Management", path: "/user-management", icon: UserCog, roles: ["admin"] },
  { title: "Settings", path: "/settings", icon: Settings, roles: ["admin", "hr_manager", "employee"] },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: Props) {
  const location = useLocation();
  const { data: role } = useUserRole();
  const navItems = allNavItems.filter((item) => item.roles.includes(role ?? "employee"));

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-0 lg:w-[68px] -translate-x-full lg:translate-x-0" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-heading font-bold text-lg text-sidebar-foreground truncate">
              HRMS
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </aside>
    </>
  );
}
