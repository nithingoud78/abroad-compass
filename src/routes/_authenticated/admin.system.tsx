import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminSystemHealth, adminSystemSettingUpsert } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import {
  Loader2,
  Server,
  Database,
  Clock,
  CheckCircle2,
  Settings2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/system")({
  head: () => ({ meta: [{ title: "System — Admin — Abroad Compass" }] }),
  component: AdminSystemPage,
});

type SystemSetting = { key: string; value: string };
type HealthData = {
  tables: { table: string; count: number }[];
  settings: SystemSetting[];
  serverTime: string;
  nodeVersion: string;
};

function AdminSystemPage() {
  const healthFn = useServerFn(adminSystemHealth);
  const upsertFn = useServerFn(adminSystemSettingUpsert);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "system"],
    queryFn: () => healthFn(),
    staleTime: 60_000,
  });

  const upsertMut = useMutation({
    mutationFn: (v: { key: string; value: unknown }) => upsertFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "system"] });
      toast.success("Setting saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // All hooks must be called before any early returns
  const typedData = data as HealthData | undefined;
  const settings: SystemSetting[] = typedData?.settings ?? [];
  const featureSetting = settings.find((s) => s.key === "features");
  const features: Record<string, boolean> = featureSetting
    ? (JSON.parse(featureSetting.value || "{}") as Record<string, boolean>)
    : {};
  const maintenanceSetting = settings.find((s) => s.key === "maintenance_mode");
  const isMaintenanceMode = maintenanceSetting
    ? JSON.parse(maintenanceSetting.value || "false") === true
    : false;
  const registrationSetting = settings.find((s) => s.key === "registration_open");
  const registrationOpen = registrationSetting
    ? JSON.parse(registrationSetting.value || "true") !== false
    : true;
  const appNameSetting = settings.find((s) => s.key === "app_name");
  const [editAppName, setEditAppName] = useState(
    (appNameSetting?.value ?? '"Abroad Compass"').replace(/^"|"$/g, ""),
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading system health…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-destructive">{(error as Error).message}</div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">System</h1>
        <p className="text-sm text-muted-foreground">
          Server health, table statistics, and global feature flags.
        </p>
      </div>

      {/* Server info */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Server Time</span>
          </div>
          <p className="mt-2 text-sm font-medium">
            {format(new Date(typedData!.serverTime), "PPpp")}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Server className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Node.js</span>
          </div>
          <p className="mt-2 font-mono text-sm font-medium">{typedData!.nodeVersion}</p>
        </Card>
        <Card className="col-span-2 p-4 sm:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs uppercase tracking-wider">Status</span>
          </div>
          <p className="mt-2 font-medium text-green-600 dark:text-green-400">
            All systems operational
          </p>
        </Card>
      </div>

      {/* Table counts */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-medium">
          <Database className="h-4 w-4 text-brand" /> Database Tables
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
          {typedData!.tables.map((t: { table: string; count: number }) => (
            <div key={t.table} className="flex items-center justify-between">
              <span className="font-mono text-sm text-muted-foreground">{t.table}</span>
              <Badge variant="secondary" className="text-xs">
                {t.count.toLocaleString()}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Feature flags */}
      {Object.keys(features).length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-medium">
            <Settings2 className="h-4 w-4 text-brand" /> Feature Flags
          </h2>
          <div className="space-y-2">
            {Object.entries(features).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {enabled ? "Enabled for all users" : "Disabled globally"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const updated = { ...features, [key]: !enabled };
                    upsertMut.mutate({ key: "features", value: updated });
                  }}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                  disabled={upsertMut.isPending}
                >
                  {enabled ? (
                    <ToggleRight className="h-7 w-7 text-brand" />
                  ) : (
                    <ToggleLeft className="h-7 w-7" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick settings */}
      <Card className="p-5">
        <h2 className="mb-4 font-medium">Quick Settings</h2>
        <div className="space-y-4">
          {/* App name */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <label className="text-sm font-medium">App Name</label>
              <Input
                value={editAppName}
                onChange={(e) => setEditAppName(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={upsertMut.isPending}
              onClick={() => upsertMut.mutate({ key: "app_name", value: editAppName })}
            >
              {upsertMut.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Save
            </Button>
          </div>

          {/* Maintenance mode */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">
                When enabled, all non-admin users see a maintenance page.
              </p>
            </div>
            <button
              onClick={() =>
                upsertMut.mutate({ key: "maintenance_mode", value: !isMaintenanceMode })
              }
              disabled={upsertMut.isPending}
              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {isMaintenanceMode ? (
                <ToggleRight className="h-7 w-7 text-destructive" />
              ) : (
                <ToggleLeft className="h-7 w-7" />
              )}
            </button>
          </div>

          {/* Registration open */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Open Registration</p>
              <p className="text-xs text-muted-foreground">Allow new users to create accounts.</p>
            </div>
            <button
              onClick={() =>
                upsertMut.mutate({ key: "registration_open", value: !registrationOpen })
              }
              disabled={upsertMut.isPending}
              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {registrationOpen ? (
                <ToggleRight className="h-7 w-7 text-brand" />
              ) : (
                <ToggleLeft className="h-7 w-7" />
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
