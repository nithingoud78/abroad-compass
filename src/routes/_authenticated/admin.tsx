import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/use-role";
import { useServerFn } from "@tanstack/react-start";
import { claimAdminIfNone } from "@/lib/admin/admin.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Newspaper,
  MessageSquare,
  Map,
  Building2,
  Library,
  Sparkles,
  BarChart3,
  Settings2,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/blog", label: "Blog", icon: Newspaper },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { to: "/admin/roadmap", label: "Roadmap", icon: Map },
  { to: "/admin/universities", label: "Universities", icon: Building2 },
  { to: "/admin/resources", label: "Resources", icon: Library },
  { to: "/admin/ai", label: "AI", icon: Sparkles },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings2 },
  { to: "/admin/system", label: "System", icon: Server },
] as const;

function AdminLayout() {
  const { isAdmin, isLoading } = useIsAdmin();
  const claim = useServerFn(claimAdminIfNone);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-brand" />
          <h1 className="mt-4 text-xl font-semibold">Admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This portal is restricted. If no admin exists yet, you can claim it (first user only).
          </p>
          <Button
            className="mt-6"
            onClick={async () => {
              try {
                const r = await claim();
                if (r.granted) {
                  toast.success("You are now an admin. Refresh to continue.");
                  setTimeout(() => window.location.reload(), 600);
                } else {
                  toast.error("An admin already exists. Ask them to grant you access.");
                }
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            Claim admin (bootstrap)
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 overflow-x-auto border-b px-4 pb-2 sm:-mx-6 sm:px-6">
        <nav className="flex min-w-max gap-1">
          {NAV.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
