import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateEmployeeSalary, useEmployeeSalaries, useEmployees, useSalaryStructures, useDeleteSalaryStructure } from "@/hooks/useSupabaseData";
import { toast } from "sonner";

interface FormState {
  employee_id: string;
  salary_structure_id: string;
  base_salary: number;
  effective_from: string;
}

const defaultForm: FormState = {
  employee_id: "",
  salary_structure_id: "",
  base_salary: 0,
  effective_from: new Date().toISOString().slice(0, 10),
};

export default function EmployeeSalaries() {
  const { data: employees = [] } = useEmployees();
  const { data: structures = [] } = useSalaryStructures();
  const { data: salaries = [], isLoading: salariesLoading } = useEmployeeSalaries();

  const createSalary = useCreateEmployeeSalary();
  const [form, setForm] = useState(defaultForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.employee_id || !form.salary_structure_id || !form.base_salary || !form.effective_from) {
      toast.error("Fill all required fields");
      return;
    }

    createSalary.mutate(
      {
        employee_id: form.employee_id,
        salary_structure_id: form.salary_structure_id,
        base_salary: Number(form.base_salary),
        allowances: null,
        effective_from: form.effective_from,
        status: "active",
      },
      {
        onSuccess: () => {
          toast.success("Salary assigned to employee");
          setForm(defaultForm);
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : "Failed to assign salary";
          toast.error(message);
        },
      }
    );
  };

  const grouped = useMemo(() => {
    return salaries.map((salary) => {
      const employee = employees.find((e) => e.id === salary.employee_id);
      const structure = structures.find((s) => s.id === salary.salary_structure_id);
      const allowances = salary.allowances ? Object.values(salary.allowances).reduce((acc, n) => acc + (Number(n) || 0), 0) : 0;
      return {
        ...salary,
        employee_name: employee?.full_name || "Unknown",
        structure_name: structure?.name || "Unassigned",
        allowanceTotal: allowances,
      };
    });
  }, [salaries, employees, structures]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Employee Salaries</h1>
        <p className="text-muted-foreground">Link employees to salary structures and base salaries.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign Salary</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={(val) => setForm((prev) => ({ ...prev, employee_id: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name || emp.employee_id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Salary Structure</Label>
              <Select value={form.salary_structure_id} onValueChange={(val) => setForm((prev) => ({ ...prev, salary_structure_id: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select structure" />
                </SelectTrigger>
                <SelectContent>
                  {structures.map((str) => (
                    <SelectItem key={str.id} value={str.id}>{str.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Salary</Label>
              <Input type="number" value={form.base_salary} onChange={(e) => setForm((prev) => ({ ...prev, base_salary: Number(e.target.value) }))} required />
            </div>
            <div className="space-y-2">
              <Label>Effective From</Label>
              <Input type="date" value={form.effective_from} onChange={(e) => setForm((prev) => ({ ...prev, effective_from: e.target.value }))} required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={createSalary.isPending}>
                <Plus className="h-4 w-4 mr-2" /> Assign
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {salariesLoading ? (
            <p>Loading...</p>
          ) : grouped.length === 0 ? (
            <p className="text-muted-foreground">No employee salaries assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {grouped.map((item) => (
                <div key={item.id} className="flex justify-between items-center border border-border rounded-lg p-3">
                  <div>
                    <p className="font-medium">{item.employee_name} ({item.structure_name})</p>
                    <p className="text-sm text-muted-foreground">
                      Base: {item.base_salary}, Allowances: {item.allowanceTotal}, Effective: {item.effective_from}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" disabled>
                    <Trash2 className="w-4 h-4" />
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
