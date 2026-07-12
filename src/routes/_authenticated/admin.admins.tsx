import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsersWithRoles, setUserRole } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Shield, ShieldCheck, ShieldAlert, MoreHorizontal, UserCog } from "lucide-react";
import { useIsSuperAdmin } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/admins")({
  head: () => ({ meta: [{ title: "Admins — Super Admin — Abroad Compass" }] }),
  component: AdminsManagementPage,
});

function AdminsManagementPage() {
  const { isSuperAdmin, isLoading: roleLoading } = useIsSuperAdmin();
  const listRoles = useServerFn(adminListUsersWithRoles);
  const setRole = useServerFn(setUserRole);
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["superadmin", "users_roles"],
    queryFn: () => listRoles(),
    enabled: isSuperAdmin,
  });

  const roleMut = useMutation({
    mutationFn: (v: { targetUserId: string; newRole: "super_admin" | "admin" | "user" }) =>
      setRole({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "users_roles"] });
      toast.success("User role updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (roleLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Verifying permissions…
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <Card className="p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">403 Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view the Super Admin Portal.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admin Management</h1>
        <p className="text-sm text-muted-foreground">
          View all users and promote or demote administrators.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading roles…
        </div>
      )}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      <div className="grid gap-2">
        {(data ?? []).map((u) => (
          <Card key={u.user_id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-col">
              <span className="font-medium">{u.display_name || "Unknown User"}</span>
              <span className="text-xs text-muted-foreground mt-1">
                Joined: {u.created_at ? format(new Date(u.created_at), "MMM d, yyyy") : "N/A"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div>
                {u.role === "super_admin" && (
                  <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Super Admin
                  </Badge>
                )}
                {u.role === "admin" && (
                  <Badge variant="default">
                    <Shield className="mr-1 h-3 w-3" /> Admin
                  </Badge>
                )}
                {u.role === "user" && (
                  <Badge variant="secondary" className="text-muted-foreground">
                    User
                  </Badge>
                )}
              </div>

              {currentUser?.id === u.user_id ? (
                <Badge variant="outline">Current Account</Badge>
              ) : u.role === "super_admin" ? null : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={roleMut.isPending}>
                      {roleMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Manage Role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {u.role === "user" && (
                      <DropdownMenuItem
                        onClick={() =>
                          roleMut.mutate({ targetUserId: u.user_id, newRole: "admin" })
                        }
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Promote to Admin
                      </DropdownMenuItem>
                    )}
                    {u.role === "admin" && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            roleMut.mutate({ targetUserId: u.user_id, newRole: "user" })
                          }
                        >
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          Demote to User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            roleMut.mutate({ targetUserId: u.user_id, newRole: "super_admin" })
                          }
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Promote to Super Admin
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </Card>
        ))}
        {data?.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground py-4">No users found.</p>
        )}
      </div>
    </div>
  );
}
