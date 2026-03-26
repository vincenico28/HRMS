import { UserPlus, LogIn, CalendarCheck, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  { icon: UserPlus, text: "New employee John Smith added to Engineering", time: "2 min ago", color: "text-success" },
  { icon: CalendarCheck, text: "Leave request approved for Maria Garcia", time: "15 min ago", color: "text-primary" },
  { icon: LogIn, text: "Admin user logged in from 192.168.1.1", time: "32 min ago", color: "text-info" },
  { icon: Edit, text: "Department 'Marketing' details updated", time: "1 hr ago", color: "text-warning" },
  { icon: Trash2, text: "Inactive employee record archived", time: "2 hr ago", color: "text-destructive" },
];

export function RecentActivity() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
      <h3 className="font-heading font-semibold text-card-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <a.icon className={cn("w-4 h-4", a.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-card-foreground leading-snug">{a.text}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
