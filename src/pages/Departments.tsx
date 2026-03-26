import { useState } from "react";
import { Building2, Plus, Users, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDepartments, useCreateDepartment, useUpdateDepartment, useEmployees } from "@/hooks/useSupabaseData";
import { useLogActivity } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const colors = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent",
  "bg-warning/10 text-warning",
  "bg-success/10 text-success",
  "bg-destructive/10 text-destructive",
  "bg-info/10 text-info",
];

export default function Departments() {
  const { data: departments, isLoading } = useDepartments();
  const { data: employees } = useEmployees();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const logActivity = useLogActivity();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEdit = (dept: any) => {
    setEditingId(dept.id);
    setName(dept.name);
    setDescription(dept.description || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateDept.mutateAsync({ id: editingId, name, description: description || null });
        logActivity.mutate({ action: "Updated department", details: { name } });
        toast({ title: "Department updated" });
      } else {
        await createDept.mutateAsync({ name, description: description || undefined });
        logActivity.mutate({ action: "Created department", details: { name } });
        toast({ title: "Department created" });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getEmployeeCount = (deptId: string) => employees?.filter((e) => e.department_id === deptId).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage organizational departments</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments?.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">No departments yet. Create one to get started.</p>
          )}
          {departments?.map((dept, i) => (
            <div key={dept.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[i % colors.length]}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-card-foreground">{dept.name}</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(dept)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
              {dept.description && <p className="text-sm text-muted-foreground mb-3">{dept.description}</p>}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Employees</span>
                <span className="text-card-foreground font-medium flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {getEmployeeCount(dept.id)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Department" : "Add Department"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Engineering" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Department description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createDept.isPending || updateDept.isPending}>
              {(createDept.isPending || updateDept.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
