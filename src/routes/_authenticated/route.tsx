import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { NotificationProvider } from "@/hooks/use-notifications";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      if (location.pathname.startsWith("/admin")) {
        throw redirect({
          to: "/admin/login" as never,
          search: { redirect: location.href } as never,
        });
      }
      throw redirect({ to: "/auth", search: { redirect: location.href } as never });
    }
    return { userId: data.user.id };
  },
  component: AuthenticatedLayout,
});

import { useIsAdmin } from "@/hooks/use-role";
import { useRouter } from "@tanstack/react-router";

function AuthenticatedLayout() {
  const [ready, setReady] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const router = useRouter();

  const { userId } = Route.useRouteContext();

  useEffect(() => {
    supabase
      .from("system_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle()
      .then(async ({ data: maintData }) => {
        const isMaint = maintData?.value === "true";
        const isLogin = pathname === "/admin/login";
        const isAdminRoute = pathname.startsWith("/admin");

        if (!isMaint) {
          const { data: profile } = await supabase.from("profiles").select("username").eq("user_id", userId).maybeSingle();
          if (!profile?.username && pathname !== "/set-username" && !isAdminRoute) {
            router.navigate({ to: "/set-username" as never });
          }
          setReady(true);
        } else {
          if (isAdmin) {
            setReady(true);
          } else if (isLogin) {
            setReady(true);
          } else if (!roleLoading) {
            router.navigate({ to: "/maintenance" as never });
          }
        }
      });
  }, [isAdmin, roleLoading, router, userId]);

  if (!ready || roleLoading) return null;

  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <Outlet />;
  }

  return (
    <NotificationProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </NotificationProvider>
  );
}
