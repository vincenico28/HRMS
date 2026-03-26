import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const requests = [
  { name: "Sarah Johnson", type: "Sick Leave", dates: "Mar 14 - Mar 16", status: "pending" },
  { name: "Mike Chen", type: "Vacation", dates: "Mar 18 - Mar 22", status: "pending" },
  { name: "Emily Davis", type: "Emergency", dates: "Mar 14", status: "pending" },
  { name: "Alex Wilson", type: "Vacation", dates: "Mar 20 - Mar 25", status: "approved" },
];

export function LeaveRequestsWidget() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
      <h3 className="font-heading font-semibold text-card-foreground mb-4">Leave Requests</h3>
      <div className="space-y-3">
        {requests.map((r, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="min-w-0">
              <p className="text-sm font-medium text-card-foreground">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.type} · {r.dates}</p>
            </div>
            {r.status === "pending" ? (
              <div className="flex gap-1.5 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-success hover:bg-success/10">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Badge variant="secondary" className="text-xs bg-success/10 text-success border-0">
                Approved
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
