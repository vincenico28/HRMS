import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JobPosting {
  id: string;
  title: string;
  department_id: string | null;
  description: string | null;
  requirements: string | null;
  employment_type: string;
  location: string | null;
  salary_range: string | null;
  status: string;
  posted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Applicant {
  id: string;
  job_posting_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  status: string;
  rating: number | null;
  notes: string | null;
  interview_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTask {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  assigned_by: string | null;
  created_at: string;
}

// ─── Job Postings ───
export function useJobPostings() {
  return useQuery({
    queryKey: ["job_postings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*, departments(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (JobPosting & { departments: { name: string } | null })[];
    },
  });
}

export function useCreateJobPosting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Omit<JobPosting, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("job_postings").insert(post).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job_postings"] }),
  });
}

export function useUpdateJobPosting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JobPosting> & { id: string }) => {
      const { data, error } = await supabase.from("job_postings").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job_postings"] }),
  });
}

export function useDeleteJobPosting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_postings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job_postings"] }),
  });
}

// ─── Applicants ───
export function useApplicants(jobPostingId?: string) {
  return useQuery({
    queryKey: ["applicants", jobPostingId],
    queryFn: async () => {
      let query = supabase
        .from("applicants")
        .select("*, job_postings(title)")
        .order("created_at", { ascending: false });
      if (jobPostingId) query = query.eq("job_posting_id", jobPostingId);
      const { data, error } = await query;
      if (error) throw error;
      return data as (Applicant & { job_postings: { title: string } | null })[];
    },
  });
}

export function useCreateApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (applicant: Omit<Applicant, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("applicants").insert(applicant).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applicants"] }),
  });
}

export function useUpdateApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Applicant> & { id: string }) => {
      const { data, error } = await supabase.from("applicants").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applicants"] }),
  });
}

// ─── Onboarding Tasks ───
export function useOnboardingTasks(employeeId?: string) {
  return useQuery({
    queryKey: ["onboarding_tasks", employeeId],
    queryFn: async () => {
      let query = supabase
        .from("onboarding_tasks")
        .select("*, employees(full_name)")
        .order("created_at", { ascending: false });
      if (employeeId) query = query.eq("employee_id", employeeId);
      const { data, error } = await query;
      if (error) throw error;
      return data as (OnboardingTask & { employees: { full_name: string } | null })[];
    },
  });
}

export function useCreateOnboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: { employee_id: string; title: string; description?: string; due_date?: string }) => {
      const { data, error } = await supabase.from("onboarding_tasks").insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding_tasks"] }),
  });
}

export function useToggleOnboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { data, error } = await supabase
        .from("onboarding_tasks")
        .update({
          is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding_tasks"] }),
  });
}
