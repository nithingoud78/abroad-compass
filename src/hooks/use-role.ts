import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type AppRole = "super_admin" | "admin" | "user";

/** Reads the current user's roles from `user_roles`. RLS makes users only see their own. */
export function useRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

export function useIsAdmin() {
  const q = useRoles();
  return { ...q, isAdmin: (q.data ?? []).some((r) => r === "admin" || r === "super_admin") };
}

export function useIsSuperAdmin() {
  const q = useRoles();
  return { ...q, isSuperAdmin: (q.data ?? []).includes("super_admin") };
}
