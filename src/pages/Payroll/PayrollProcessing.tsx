import { useMemo, useState } from "react";
import { Download, Play, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAttendance, useEmployeeSalaries, usePayslips, useCreatePayslip } from "@/hooks/useSupabaseData";

const WORKING_DAYS = 22;

interface PayrollRow {
  employee_id: string;
  full_name: string;
  employee_code: string;
  base_salary: number;
  allowances: number;
  attendanceScore: number;
  deductions: number;
  netPay: number;
  month: string;
}

const toMonthKey = (value: string) => value;

export default function PayrollProcessing() {
  const [month, setMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const { data: employeeSalaries = [], isLoading: salariesLoading } = useEmployeeSalaries();
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useAttendance();
  const { data: existingPayslips = [] } = usePayslips();
  const createPayslip = useCreatePayslip();

  const payrollRows = useMemo<PayrollRow[]>(() => {
    const targetMonth = month;
    return employeeSalaries.map((item) => {
      const records = attendanceRecords.filter((r) => r.employee_id === item.employee_id && r.date.startsWith(targetMonth));
      const present = records.filter((r) => r.status === "present").length;
      const halfDays = records.filter((r) => r.status === "half_day").length;
      const late = records.filter((r) => r.status === "late").length;
      const absent = records.filter((r) => r.status === "absent").length;

      const attScore = Math.min(1, Math.max(0, (present + halfDays * 0.5 + late * 0.8) / WORKING_DAYS));
      const deduction = (absent + Math.max(0, late - 2) * 0.1) * (item.base_salary / WORKING_DAYS);
      const allowanceSum = Number(item.allowances ? Object.values(item.allowances).reduce((acc, v) => acc + (Number(v) || 0), 0) : 0);
      const gross = item.base_salary * attScore + allowanceSum;
      const net = Math.max(0, gross - deduction);

      return {
        employee_id: item.employee_id,
        full_name: item.employees?.full_name ?? "Unknown",
        employee_code: item.employees?.employee_id ?? "",
        base_salary: item.base_salary,
        allowances: allowanceSum,
        attendanceScore: Math.round(attScore * 100) / 100,
        deductions: Math.round(deduction * 100) / 100,
        netPay: Math.round(net * 100) / 100,
        month: targetMonth,
      };
    });
  }, [employeeSalaries, attendanceRecords, month]);

  const handleProcess = () => {
    if (payrollRows.length === 0) {
      toast.error("No employee salaries available for this month");
      return;
    }

    payrollRows.forEach((row) => {
      createPayslip.mutate(
        {
          employee_id: row.employee_id,
          month: `${row.month}-01`,
          base_salary: row.base_salary,
          allowances: { total: row.allowances },
          deductions: row.deductions,
          net_pay: row.netPay,
          generated_by: null,
        },
        {
          onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "Could not generate payslip";
            toast.error(message);
          },
        }
      );
    });

    toast.success("Payroll processed and payslips recorded");
  };

  const canExport = (row: PayrollRow) => {
    const text = `Payslip for ${row.full_name} (${row.employee_code})\nMonth: ${row.month}\nBase Salary: ${row.base_salary}\nAllowances: ${row.allowances}\nDeductions: ${row.deductions}\nNet Pay: ${row.netPay}`;
    const blob = new Blob([text], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${row.employee_code || row.employee_id}-${row.month}-payslip.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const alreadyGeneratedForMonth = existingPayslips.some((ps) => ps.month?.startsWith(month));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Payroll Processing</h1>
          <p className="text-muted-foreground">Generate monthly payroll and auto-store payslips.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <Button onClick={handleProcess} disabled={createPayslip.isPending || salariesLoading || attendanceLoading}>
            <Play className="mr-2 h-4 w-4" /> Process
          </Button>
        </div>
      </div>

      {alreadyGeneratedForMonth && (
        <p className="text-sm text-warning">Payslips for {month} already exist in the database.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payroll Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left">Employee</th>
                  <th className="px-3 py-2 text-left">Base</th>
                  <th className="px-3 py-2 text-left">Allowances</th>
                  <th className="px-3 py-2 text-left">Attend %</th>
                  <th className="px-3 py-2 text-left">Deductions</th>
                  <th className="px-3 py-2 text-left">Net</th>
                  <th className="px-3 py-2 text-left">PDF</th>
                </tr>
              </thead>
              <tbody>
                {payrollRows.map((row) => (
                  <tr key={`${row.employee_id}-${row.month}`} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 font-medium">{row.full_name}</td>
                    <td className="px-3 py-2">{row.base_salary}</td>
                    <td className="px-3 py-2">{row.allowances}</td>
                    <td className="px-3 py-2">{row.attendanceScore * 100}%</td>
                    <td className="px-3 py-2">{row.deductions}</td>
                    <td className="px-3 py-2">{row.netPay}</td>
                    <td className="px-3 py-2">
                      <Button variant="secondary" size="sm" onClick={() => canExport(row)}>
                        <FileText className="mr-1 h-4 w-4" /> Export
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historical Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          {existingPayslips.length === 0 ? (
            <p className="text-muted-foreground">No payslips generated yet.</p>
          ) : (
            <ul className="space-y-2">
              {existingPayslips.slice(0, 20).map((ps) => (
                <li key={ps.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p>{ps.employees?.full_name ?? ps.employee_id}</p>
                    <p className="text-xs text-muted-foreground">{ps.month} · Net: {ps.net_pay}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => canExport({
                    employee_id: ps.employee_id,
                    full_name: ps.employees?.full_name ?? "",
                    employee_code: ps.employees?.employee_id ?? "",
                    base_salary: ps.base_salary,
                    allowances: ps.allowances ? Number(ps.allowances.total) : 0,
                    attendanceScore: 1,
                    deductions: ps.deductions,
                    netPay: ps.net_pay,
                    month: ps.month.slice(0, 7),
                  })}>
                    <Download className="mr-1 h-4 w-4" /> PDF
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
