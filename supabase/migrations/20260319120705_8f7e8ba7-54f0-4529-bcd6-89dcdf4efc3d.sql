
-- Training Programs table
CREATE TABLE public.training_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  duration_hours INTEGER NOT NULL DEFAULT 1,
  instructor TEXT,
  max_participants INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view training programs" ON public.training_programs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage training programs" ON public.training_programs
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager'));

-- Training Enrollments table
CREATE TABLE public.training_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  feedback TEXT,
  UNIQUE(program_id, employee_id)
);

ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage enrollments" ON public.training_enrollments
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager'));

CREATE POLICY "Employees view own enrollments" ON public.training_enrollments
  FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- Certifications table
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_body TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  credential_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage certifications" ON public.certifications
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager'));

CREATE POLICY "Employees view own certifications" ON public.certifications
  FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));
