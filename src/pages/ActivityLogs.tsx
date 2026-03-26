import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useActivityLogs } from "@/hooks/useSupabaseData";
import { useState } from "react";

const typeColors: Record<string, string> = {
  auth: "bg-info/10 text-info",
  create: "bg-success/10 text-success",
  update: "bg-warning/10 text-warning",
  delete: "bg-destructive/10 text-destructive",
  system: "bg-muted text-muted-foreground",
};

function getActionType(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("login") || lower.includes("logged") || lower.includes("sign")) return "auth";
  if (lower.includes("created") || lower.includes("added")) return "create";
  if (lower.includes("updated") || lower.includes("approved") || lower.includes("rejected")) return "update";
  if (lower.includes("deleted") || lower.includes("archived")) return "delete";
  return "system";
}

export default function ActivityLogs() {
  const { data: logs, isLoading } = useActivityLogs();
  const [search, setSearch] = useState("");

  const filtered = logs?.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground mt-1">Monitor system activities and security events</p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search logs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">IP Address</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No activity logs found</td></tr>
                )}
                {filtered?.map((l) => {
                  const type = getActionType(l.action);
                  return (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-card-foreground">{l.action}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell font-mono text-xs">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell font-mono text-xs">{l.ip_address || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`border-0 capitalize ${typeColors[type]}`}>{type}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
