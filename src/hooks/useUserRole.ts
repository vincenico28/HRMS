import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "hr_manager" | "employee";

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_role", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as AppRole) ?? "employee";
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useIsAdmin() {
  const { data: role } = useUserRole();
  return role === "admin" || role === "hr_manager";
}
