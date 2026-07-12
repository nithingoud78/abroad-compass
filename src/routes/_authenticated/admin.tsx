import {
  createFileRoute,
  Outlet,
  Link,
  useRouterState,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { useIsAdmin, useIsSuperAdmin } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import {
  Loader2,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Newspaper,
  MessageSquare,
  Sparkles,
  BarChart3,
  Settings2,
  Server,
  ScrollText,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bot,
  BookOpen,
  LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw redirect({ to: "/admin/login" });
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      toast.error("You are not authorized to access the Admin Portal.");
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { to: "/admin/blog", label: "Blog", icon: Newspaper },
  { to: "/admin/legal", label: "Legal Pages", icon: ScrollText },
  { to: "/admin/footer", label: "Footer", icon: LinkIcon },
  { to: "/admin/support", label: "Support QR", icon: MessageSquare },
  { to: "/admin/ai", label: "AI API", icon: Bot },
  { to: "/admin/system", label: "System", icon: Server },
  { to: "/admin/logs", label: "Logs", icon: ScrollText },
  { to: "/admin/testas", label: "TestAS", icon: BookOpen },
  { to: "/admin/settings", label: "Settings", icon: Settings2 },
  { to: "/admin/profile", label: "Profile", icon: UserCircle },
] as const;

function AdminLayout() {
  const { isAdmin, isLoading } = useIsAdmin();
  const { isSuperAdmin } = useIsSuperAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <Card className="p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">403 Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view the Admin Portal.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => navigate({ to: "/" })}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const initials =
    (user?.user_metadata?.display_name as string | undefined)?.slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    "AD";

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // Breadcrumb: derive from pathname
  const crumb = NAV.find((n) => pathname === n.to || pathname.startsWith(n.to + "/"));

  const Sidebar = () => (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-56",
      )}
    >
      {/* Sidebar header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-3">
        {!collapsed && (
          <span className="font-display text-sm font-semibold tracking-tight">Admin Panel</span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {NAV.map((n) => {
            if (n.to === "/admin/admins" && !isSuperAdmin) return null;
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <li key={n.to}>
                <Link
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  title={collapsed ? n.label : undefined}
                >
                  <n.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{n.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t p-2">
        <Link
          to="/dashboard"
          className={cn(
            "flex w-full items-center justify-center rounded-lg p-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground mb-2",
            !collapsed && "justify-start gap-2",
          )}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Return to Abroad Compass</span>}
        </Link>
        {!collapsed ? (
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-brand text-brand-foreground text-[10px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user?.email}</p>
              <Badge variant="secondary" className="mt-0.5 text-[9px] px-1 py-0">
                {isSuperAdmin ? "super admin" : "admin"}
              </Badge>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-destructive"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] overflow-hidden rounded-xl border bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:h-full md:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex h-full w-56 flex-col bg-card shadow-xl">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Inner topbar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card/50 px-4">
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm">
            <Link to="/admin/dashboard" className="text-muted-foreground hover:text-foreground">
              Admin
            </Link>
            {crumb && crumb.to !== "/admin/dashboard" && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium">{crumb.label}</span>
              </>
            )}
            {!crumb && pathname !== "/admin/dashboard" && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium capitalize">{pathname.split("/").pop()}</span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden text-xs sm:inline-flex">
              Admin Portal
            </Badge>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
