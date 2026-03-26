import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrainingProgram {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_hours: number;
  instructor: string | null;
  max_participants: number | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingEnrollment {
  id: string;
  program_id: string;
  employee_id: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  score: number | null;
  feedback: string | null;
}

export interface Certification {
  id: string;
  employee_id: string;
  name: string;
  issuing_body: string | null;
  issue_date: string;
  expiry_date: string | null;
  credential_id: string | null;
  status: string;
  created_at: string;
}

// ─── Training Programs ───
export function useTrainingPrograms() {
  return useQuery({
    queryKey: ["training_programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TrainingProgram[];
    },
  });
}

export function useCreateTrainingProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (program: Omit<TrainingProgram, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("training_programs").insert(program).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_programs"] }),
  });
}

export function useUpdateTrainingProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrainingProgram> & { id: string }) => {
      const { data, error } = await supabase.from("training_programs").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_programs"] }),
  });
}

export function useDeleteTrainingProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_programs"] }),
  });
}

// ─── Enrollments ───
export function useTrainingEnrollments(programId?: string) {
  return useQuery({
    queryKey: ["training_enrollments", programId],
    queryFn: async () => {
      let query = supabase
        .from("training_enrollments")
        .select("*, employees(full_name, employee_id), training_programs(title)")
        .order("enrolled_at", { ascending: false });
      if (programId) query = query.eq("program_id", programId);
      const { data, error } = await query;
      if (error) throw error;
      return data as (TrainingEnrollment & {
        employees: { full_name: string; employee_id: string } | null;
        training_programs: { title: string } | null;
      })[];
    },
  });
}

export function useEnrollEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enrollment: { program_id: string; employee_id: string }) => {
      const { data, error } = await supabase.from("training_enrollments").insert(enrollment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_enrollments"] }),
  });
}

export function useUpdateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; completed_at?: string; score?: number; feedback?: string }) => {
      const { data, error } = await supabase.from("training_enrollments").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_enrollments"] }),
  });
}

// ─── Certifications ───
export function useCertifications(employeeId?: string) {
  return useQuery({
    queryKey: ["certifications", employeeId],
    queryFn: async () => {
      let query = supabase
        .from("certifications")
        .select("*, employees(full_name, employee_id)")
        .order("issue_date", { ascending: false });
      if (employeeId) query = query.eq("employee_id", employeeId);
      const { data, error } = await query;
      if (error) throw error;
      return data as (Certification & { employees: { full_name: string; employee_id: string } | null })[];
    },
  });
}

export function useCreateCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cert: Omit<Certification, "id" | "created_at">) => {
      const { data, error } = await supabase.from("certifications").insert(cert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certifications"] }),
  });
}

export function useDeleteCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certifications"] }),
  });
}
