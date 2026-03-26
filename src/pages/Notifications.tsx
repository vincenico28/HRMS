import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useSupabaseData";

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const formatTime = (t: string) => {
    const diff = Date.now() - new Date(t).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} day ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with system alerts</p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0" onClick={() => markAllRead.mutate()}>
          <CheckCheck className="w-4 h-4" /> Mark All Read
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {notifications?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No notifications yet</p>
          )}
          {notifications?.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead.mutate(n.id)}
              className={`bg-card rounded-xl border border-border p-4 flex items-start gap-4 transition-shadow hover:shadow-sm animate-fade-in cursor-pointer ${!n.read ? "border-l-4 border-l-primary" : ""}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                <Bell className={`w-4 h-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground">{n.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTime(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
