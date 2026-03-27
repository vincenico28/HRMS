import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSalaryStructures, useCreateSalaryStructure, useDeleteSalaryStructure } from "@/hooks/useSupabaseData";
import { toast } from "sonner";

const defaultStructure = {
  name: "",
  min_salary: 0,
  max_salary: 0,
  allowances: "{}",
};

export default function SalaryStructures() {
  const { data: structures = [], isLoading } = useSalaryStructures();
  const createStructure = useCreateSalaryStructure();
  const deleteStructure = useDeleteSalaryStructure();

  const [form, setForm] = useState(defaultStructure);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    let allowances;
    try {
      allowances = JSON.parse(form.allowances);
      if (typeof allowances !== "object" || Array.isArray(allowances)) {
        throw new Error("Allowances must be an object");
      }
    } catch (err) {
      toast.error("Allowances JSON is invalid");
      return;
    }

    createStructure.mutate(
      {
        name: form.name.trim(),
        min_salary: Number(form.min_salary),
        max_salary: Number(form.max_salary),
        allowances,
      },
      {
        onSuccess: () => {
          toast.success("Salary structure created");
          setForm(defaultStructure);
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : "Failed to create structure";
          toast.error(message);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete salary structure?")) return;
    deleteStructure.mutate(id, {
      onSuccess: () => toast.success("Deleted"),
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "Delete failed";
        toast.error(message);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Salary Structures</h1>
          <p className="text-muted-foreground">Define salary bands and allowances.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Salary Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Minimum Salary</Label>
              <Input type="number" value={form.min_salary} onChange={(e) => setForm((prev) => ({ ...prev, min_salary: Number(e.target.value) }))} required />
            </div>
            <div className="space-y-2">
              <Label>Maximum Salary</Label>
              <Input type="number" value={form.max_salary} onChange={(e) => setForm((prev) => ({ ...prev, max_salary: Number(e.target.value) }))} required />
            </div>
            <div className="space-y-2">
              <Label>Allowances JSON</Label>
              <Input value={form.allowances} onChange={(e) => setForm((prev) => ({ ...prev, allowances: e.target.value }))} placeholder='{"hra":1200, "transport":300}' />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={createStructure.isPending}>
                <Plus className="mr-2 h-4 w-4" /> Create Structure
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Structures</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : structures.length === 0 ? (
            <div className="text-muted-foreground">No structures yet.</div>
          ) : (
            <div className="grid gap-4">
              {structures.map((structure) => (
                <div key={structure.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-semibold">{structure.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {structure.min_salary} - {structure.max_salary}
                    </p>
                    <p className="text-xs text-muted-foreground">Allowances: {JSON.stringify(structure.allowances)}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(structure.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
