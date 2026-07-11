import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CheckCircle2,
  GraduationCap,
  BookA,
  Plane,
  Building2,
  Wallet,
  FolderKanban,
  BarChart3,
  Wrench,
  Newspaper,
  MessageSquare,
  Settings as SettingsIcon,
  Compass,
  Sparkles,
  FileText,
  Shield,
  Bell,
  CalendarDays,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const primary = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Assistant", url: "/assistant", icon: Sparkles },
  { title: "Document Review", url: "/assistant/review", icon: FileText },
  { title: "Daily Check-in", url: "/check-in", icon: CheckCircle2 },
  { title: "German Learning", url: "/german", icon: GraduationCap },
  { title: "Vocabulary", url: "/vocabulary", icon: BookA },
  { title: "Germany Journey", url: "/germany-journey", icon: Plane },
];

const planning = [
  { title: "University Shortlisting", url: "/university", icon: Building2 },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Budget", url: "/budget", icon: Wallet },
  { title: "Portfolio", url: "/portfolio", icon: FolderKanban },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const more = [
  { title: "Tools", url: "/tools", icon: Wrench },
  { title: "Blog", url: "/blog", icon: Newspaper },
  { title: "Feedback", url: "/feedback", icon: MessageSquare },
  { title: "Notifications", url: "/settings/notifications", icon: Bell },
  { title: "Security", url: "/settings/security", icon: Shield },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-foreground text-background">
            <Compass className="h-4 w-4" />
          </span>
          {!collapsed && (
            <span className="font-display text-sm font-semibold tracking-tight">
              Abroad Compass
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <Section label="Workspace" items={primary} isActive={isActive} collapsed={collapsed} />
        <Section label="Planning" items={planning} isActive={isActive} collapsed={collapsed} />
        <Section label="More" items={more} isActive={isActive} collapsed={collapsed} />
      </SidebarContent>
    </Sidebar>
  );
}

function Section({
  label,
  items,
  isActive,
  collapsed,
}: {
  label: string;
  items: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[];
  isActive: (url: string) => boolean;
  collapsed: boolean;
}) {
  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((it) => (
            <SidebarMenuItem key={it.url}>
              <SidebarMenuButton asChild isActive={isActive(it.url)} tooltip={it.title}>
                <Link to={it.url} className="flex items-center gap-2">
                  <it.icon className="h-4 w-4" />
                  {!collapsed && <span>{it.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
