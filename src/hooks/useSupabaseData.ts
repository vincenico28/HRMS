import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  position: string;
  date_hired: string;
  status: string;
  address: string | null;
  profile_photo: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ─── Employees ───
export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, departments!employees_department_id_fkey(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Employee & { departments: { name: string } | null })[];
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emp: Omit<Employee, "id" | "created_at" | "updated_at" | "user_id">) => {
      const { data, error } = await supabase.from("employees").insert(emp).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Employee> & { id: string }) => {
      const { data, error } = await supabase.from("employees").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

// ─── Departments ───
export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data as Department[];
    },
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dept: { name: string; description?: string }) => {
      const { data, error } = await supabase.from("departments").insert(dept).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Department> & { id: string }) => {
      const { data, error } = await supabase.from("departments").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
}

// ─── Attendance ───
export function useAttendance() {
  return useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, employees(full_name)")
        .order("date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as (AttendanceRecord & { employees: { full_name: string } | null })[];
    },
  });
}

export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: { employee_id: string; date: string; time_in?: string; time_out?: string; status: string }) => {
      const { data, error } = await supabase.from("attendance").insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

// ─── Leave Requests ───
export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*, employees!leave_requests_employee_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (LeaveRequest & { employees: { full_name: string } | null })[];
    },
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: { employee_id: string; leave_type: string; start_date: string; end_date: string; reason?: string }) => {
      const { data, error } = await supabase.from("leave_requests").insert(req).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave_requests"] }),
  });
}

export function useUpdateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; reviewed_by?: string; reviewed_at?: string }) => {
      const { data, error } = await supabase.from("leave_requests").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave_requests"] }),
  });
}

// ─── Notifications ───
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ─── Activity Logs ───
export function useActivityLogs() {
  return useQuery({
    queryKey: ["activity_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as ActivityLog[];
    },
  });
}

export function useLogActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: { action: string; details?: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: log.action,
        details: log.details || {},
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activity_logs"] }),
  });
}

// ─── Dashboard Stats ───
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const [empRes, deptRes, leaveRes, attRes] = await Promise.all([
        supabase.from("employees").select("id, status, date_hired", { count: "exact" }),
        supabase.from("departments").select("id", { count: "exact" }),
        supabase.from("leave_requests").select("id, status").eq("status", "pending"),
        supabase.from("attendance").select("id, status").eq("date", new Date().toISOString().split("T")[0]),
      ]);

      const employees = empRes.data || [];
      const totalEmployees = empRes.count || 0;
      const activeEmployees = employees.filter((e) => e.status === "active").length;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newHires = employees.filter((e) => new Date(e.date_hired) >= thirtyDaysAgo).length;
      const pendingLeaves = leaveRes.data?.length || 0;

      return { totalEmployees, activeEmployees, newHires, pendingLeaves };
    },
  });
}

// ─── Payroll (Salary Structures, Employee Salaries, Payslips) ───
export interface SalaryStructure {
  id: string;
  name: string;
  min_salary: number;
  max_salary: number;
  allowances: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSalary {
  id: string;
  employee_id: string;
  salary_structure_id: string;
  base_salary: number;
  allowances: Record<string, number> | null;
  effective_from: string;
  status: string;
  created_at: string;
  updated_at: string;
  employees?: { full_name: string; employee_id: string };
  salary_structures?: { name: string };
}

export interface Payslip {
  id: string;
  employee_id: string;
  month: string;
  base_salary: number;
  allowances: Record<string, number> | null;
  deductions: number;
  net_pay: number;
  generated_by: string | null;
  created_at: string;
  updated_at: string;
  employees?: { full_name: string; employee_id: string };
}

export function useSalaryStructures() {
  return useQuery({
    queryKey: ["salary_structures"],
    queryFn: async () => {
      const { data, error } = await supabase.from("salary_structures").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as SalaryStructure[];
    },
  });
}

export function useCreateSalaryStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (structure: Omit<SalaryStructure, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("salary_structures").insert(structure).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary_structures"] }),
  });
}

export function useUpdateSalaryStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalaryStructure> & { id: string }) => {
      const { data, error } = await supabase.from("salary_structures").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary_structures"] }),
  });
}

export function useDeleteSalaryStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_structures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary_structures"] }),
  });
}

export function useEmployeeSalaries() {
  return useQuery({
    queryKey: ["employee_salaries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_salaries")
        .select("*, employees(full_name, employee_id), salary_structures(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmployeeSalary[];
    },
  });
}

export function useCreateEmployeeSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (salary: Omit<EmployeeSalary, "id" | "created_at" | "updated_at" | "employees" | "salary_structures">) => {
      const { data, error } = await supabase.from("employee_salaries").insert(salary).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee_salaries"] }),
  });
}

export function usePayslips() {
  return useQuery({
    queryKey: ["payslips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payslips")
        .select("*, employees(full_name, employee_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Payslip[];
    },
  });
}

export function useCreatePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payslip: Omit<Payslip, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("payslips").insert(payslip).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payslips"] }),
  });
}

// ─── Expense Claims ───
export interface ExpenseClaim {
  id: string;
  employee_id: string;
  amount: number;
  description: string;
  receipt_url: string | null;
  status: string;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  employees?: { full_name: string; employee_id: string };
}

export function useExpenseClaims() {
  return useQuery({
    queryKey: ["expense_claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_claims")
        .select("*, employees(full_name, employee_id)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as ExpenseClaim[];
    },
  });
}

export function useCreateExpenseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (claim: Omit<ExpenseClaim, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("expense_claims").insert(claim).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expense_claims"] }),
  });
}

