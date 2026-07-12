import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Moon,
  Search,
  Sun,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  Monitor,
} from "lucide-react";
import { NotificationCenter } from "@/components/app/NotificationCenter";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/app/AppSidebar";
import { Footer } from "@/components/app/Footer";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { DailyCheckinModal } from "@/components/app/DailyCheckinModal";
import { CommandPalette } from "@/components/app/CommandPalette";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { theme, setTheme, resolved } = useTheme();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [profileChecked, setProfileChecked] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdkOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Onboarding redirect
  useEffect(() => {
    if (!user) return;
    if (pathname === "/onboarding") {
      setProfileChecked(true);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data && !data.onboarding_completed) {
          navigate({ to: "/onboarding" });
        }
        setProfileChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, pathname, navigate]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials =
    (user?.user_metadata?.display_name as string | undefined)?.slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    "AC";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col bg-background min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-xl sm:px-5">
          <SidebarTrigger />
          <button
            onClick={() => setCmdkOpen(true)}
            className="relative ml-2 hidden h-9 max-w-md flex-1 items-center gap-2 rounded-full border bg-background px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent md:flex"
            aria-label="Open command palette"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1">Search universities, tasks, documents…</span>
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium md:inline">
              ⌘K
            </kbd>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search"
            onClick={() => setCmdkOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
          <div className="flex-1 md:hidden" />
          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Theme">
                  {resolved === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" /> Light{" "}
                  {theme === "light" && (
                    <Badge variant="secondary" className="ml-auto">
                      On
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" /> Dark{" "}
                  {theme === "dark" && (
                    <Badge variant="secondary" className="ml-auto">
                      On
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="mr-2 h-4 w-4" /> System{" "}
                  {theme === "system" && (
                    <Badge variant="secondary" className="ml-auto">
                      On
                    </Badge>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Profile">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-brand text-brand-foreground text-[10px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        <Footer />
        {profileChecked && pathname !== "/onboarding" && <DailyCheckinModal />}
      </SidebarInset>
      <CommandPalette open={cmdkOpen} onOpenChange={setCmdkOpen} />
    </SidebarProvider>
  );
}
