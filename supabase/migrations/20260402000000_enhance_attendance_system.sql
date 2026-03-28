-- Enhanced Attendance System
-- Add overtime requests table and enhance attendance tracking

-- Overtime Requests table
CREATE TABLE public.overtime_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.overtime_requests ENABLE ROW LEVEL SECURITY;

-- Time Logs table for multiple IN/OUT entries per day
CREATE TABLE public.time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_stamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Add work schedule to employees table
ALTER TABLE public.employees
ADD COLUMN work_start_time TIME DEFAULT '09:00',
ADD COLUMN work_end_time TIME DEFAULT '17:00',
ADD COLUMN break_duration INTEGER DEFAULT 60; -- minutes

-- RLS Policies for overtime_requests
CREATE POLICY "Employees view own overtime requests" ON public.overtime_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can create overtime requests" ON public.overtime_requests FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Admins view all overtime requests" ON public.overtime_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr_manager'));
CREATE POLICY "Admins manage overtime requests" ON public.overtime_requests FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr_manager'));

-- RLS Policies for time_logs
CREATE POLICY "Employees view own time logs" ON public.time_logs FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can create time logs" ON public.time_logs FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Admins view all time logs" ON public.time_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr_manager'));
CREATE POLICY "Admins manage time logs" ON public.time_logs FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr_manager'));

-- Function to calculate attendance status based on time logs
CREATE OR REPLACE FUNCTION calculate_attendance_status(
  p_employee_id UUID,
  p_date DATE
) RETURNS TEXT AS $$
DECLARE
  work_start TIME;
  work_end TIME;
  break_duration INTEGER;
  first_in TIMESTAMPTZ;
  last_out TIMESTAMPTZ;
  total_hours DECIMAL(4,2);
  late_minutes INTEGER;
  undertime_minutes INTEGER;
BEGIN
  -- Get employee's work schedule
  SELECT work_start_time, work_end_time, break_duration
  INTO work_start, work_end, break_duration
  FROM employees WHERE id = p_employee_id;

  -- Get first IN and last OUT for the day
  SELECT MIN(time_stamp) INTO first_in
  FROM time_logs
  WHERE employee_id = p_employee_id AND date = p_date AND type = 'in';

  SELECT MAX(time_stamp) INTO last_out
  FROM time_logs
  WHERE employee_id = p_employee_id AND date = p_date AND type = 'out';

  -- If no time logs, return 'absent'
  IF first_in IS NULL OR last_out IS NULL THEN
    RETURN 'absent';
  END IF;

  -- Calculate total hours worked (subtract break)
  total_hours := EXTRACT(EPOCH FROM (last_out - first_in)) / 3600 - (break_duration / 60.0);

  -- Calculate late arrival
  late_minutes := GREATEST(0, EXTRACT(EPOCH FROM (first_in::time - work_start)) / 60);

  -- Calculate undertime (early departure)
  undertime_minutes := GREATEST(0, EXTRACT(EPOCH FROM (work_end - last_out::time)) / 60);

  -- Determine status
  IF late_minutes > 0 AND undertime_minutes > 0 THEN
    RETURN 'late_and_undertime';
  ELSIF late_minutes > 15 THEN
    RETURN 'late';
  ELSIF undertime_minutes > 15 THEN
    RETURN 'undertime';
  ELSIF total_hours < 4 THEN
    RETURN 'half_day';
  ELSE
    RETURN 'present';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get attendance summary for reports
CREATE OR REPLACE FUNCTION get_attendance_summary(
  p_employee_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  date DATE,
  status TEXT,
  time_in TIMESTAMPTZ,
  time_out TIMESTAMPTZ,
  total_hours DECIMAL(4,2),
  late_minutes INTEGER,
  undertime_minutes INTEGER,
  overtime_hours DECIMAL(4,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.full_name,
    tl.date,
    calculate_attendance_status(e.id, tl.date) as status,
    MIN(CASE WHEN tl.type = 'in' THEN tl.time_stamp END) as time_in,
    MAX(CASE WHEN tl.type = 'out' THEN tl.time_stamp END) as time_out,
    CASE
      WHEN MIN(CASE WHEN tl.type = 'in' THEN tl.time_stamp END) IS NOT NULL
           AND MAX(CASE WHEN tl.type = 'out' THEN tl.time_stamp END) IS NOT NULL
      THEN ROUND(EXTRACT(EPOCH FROM (
        MAX(CASE WHEN tl.type = 'out' THEN tl.time_stamp END) -
        MIN(CASE WHEN tl.type = 'in' THEN tl.time_stamp END)
      )) / 3600 - (e.break_duration / 60.0), 2)
      ELSE 0
    END as total_hours,
    GREATEST(0, EXTRACT(EPOCH FROM (
      MIN(CASE WHEN tl.type = 'in' THEN tl.time_stamp END)::time - e.work_start_time
    )) / 60)::INTEGER as late_minutes,
    GREATEST(0, EXTRACT(EPOCH FROM (
      e.work_end_time - MAX(CASE WHEN tl.type = 'out' THEN tl.time_stamp END)::time
    )) / 60)::INTEGER as undertime_minutes,
    COALESCE(ot.hours, 0) as overtime_hours
  FROM employees e
  LEFT JOIN time_logs tl ON e.id = tl.employee_id
    AND (p_start_date IS NULL OR tl.date >= p_start_date)
    AND (p_end_date IS NULL OR tl.date <= p_end_date)
  LEFT JOIN overtime_requests ot ON e.id = ot.employee_id
    AND ot.date = tl.date
    AND ot.status = 'approved'
  WHERE (p_employee_id IS NULL OR e.id = p_employee_id)
  GROUP BY e.id, e.full_name, tl.date, e.work_start_time, e.work_end_time, e.break_duration, ot.hours
  ORDER BY tl.date DESC, e.full_name;
END;
$$ LANGUAGE plpgsql;