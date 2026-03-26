import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Search, Pin, Megaphone, Trash2, Calendar } from "lucide-react";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useUpdateAnnouncement } from "@/hooks/useAnnouncements";

const categories = ["general", "policy", "event", "urgent", "celebration"];
const categoryColors: Record<string, string> = {
  general: "bg-primary/10 text-primary border-primary/20",
  policy: "bg-info/10 text-info border-info/20",
  event: "bg-accent/10 text-accent border-accent/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  celebration: "bg-warning/10 text-warning border-warning/20",
};

export default function Announcements() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: announcements = [], isLoading } = useAnnouncements();
  const createAnn = useCreateAnnouncement();
  const deleteAnn = useDeleteAnnouncement();
  const updateAnn = useUpdateAnnouncement();

  const filtered = announcements
    .filter((a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()))
    .filter((a) => filterCategory === "all" || a.category === filterCategory);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createAnn.mutate(
      {
        title: fd.get("title") as string,
        content: fd.get("content") as string,
        category: fd.get("category") as string,
        is_pinned: fd.get("is_pinned") === "on",
      },
      {
        onSuccess: () => { toast.success("Announcement published"); setDialogOpen(false); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">Company-wide announcements and communications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New Announcement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Publish Announcement</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Title *</Label><Input name="title" required /></div>
              <div className="space-y-2"><Label>Content *</Label><Textarea name="content" required rows={5} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select name="category" defaultValue="general">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pin to top</Label>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch name="is_pinned" />
                    <span className="text-sm text-muted-foreground">Pinned</span>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createAnn.isPending}>
                {createAnn.isPending ? "Publishing..." : "Publish"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search announcements..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Announcements list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />No announcements found.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((ann) => (
            <Card key={ann.id} className={`transition-shadow hover:shadow-md ${ann.is_pinned ? "border-l-4 border-l-primary" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {ann.is_pinned && <Pin className="w-4 h-4 text-primary shrink-0" />}
                    <CardTitle className="text-lg">{ann.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={categoryColors[ann.category] || ""}>{ann.category}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateAnn.mutate({ id: ann.id, is_pinned: !ann.is_pinned }, { onSuccess: () => toast.success(ann.is_pinned ? "Unpinned" : "Pinned") })}
                    >
                      <Pin className={`w-3.5 h-3.5 ${ann.is_pinned ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAnn.mutate(ann.id, { onSuccess: () => toast.success("Deleted") })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{ann.content}</p>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(ann.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
