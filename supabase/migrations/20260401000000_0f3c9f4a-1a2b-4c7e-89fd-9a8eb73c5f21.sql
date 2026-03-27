-- Salary Structures
CREATE TABLE public.salary_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_salary NUMERIC NOT NULL DEFAULT 0,
  max_salary NUMERIC NOT NULL DEFAULT 0,
  allowances JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view salary structures" ON public.salary_structures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and HR can manage salary structures" ON public.salary_structures FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager'));

-- Employee Salaries
CREATE TABLE public.employee_salaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  salary_structure_id UUID REFERENCES public.salary_structures(id) ON DELETE SET NULL,
  base_salary NUMERIC NOT NULL,
  allowances JSONB,
  effective_from DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view own employee salary" ON public.employee_salaries FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager') OR employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);
CREATE POLICY "Admins and HR can manage employee salaries" ON public.employee_salaries FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager'));

-- Expense Claims
CREATE TABLE public.expense_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view own claims" ON public.expense_claims FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager') OR employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);
CREATE POLICY "Admins and HR can manage claims" ON public.expense_claims FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager'));

-- Payslips
CREATE TABLE public.payslips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  base_salary NUMERIC NOT NULL,
  allowances JSONB,
  deductions NUMERIC NOT NULL,
  net_pay NUMERIC NOT NULL,
  generated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view own payslips" ON public.payslips FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager') OR employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);
CREATE POLICY "Admins and HR can manage payslips" ON public.payslips FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager'));
