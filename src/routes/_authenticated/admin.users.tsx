import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { deleteUser, listUsers, setUserRole } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  MoreHorizontal,
  UserCog,
  Trash2,
} from "lucide-react";
import { useIsSuperAdmin } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin — Abroad Compass" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { isSuperAdmin } = useIsSuperAdmin();
  const { user: currentUser } = useAuth();
  const list = useServerFn(listUsers);
  const setRole = useServerFn(setUserRole);
  const del = useServerFn(deleteUser);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  // simple debounce
  useState(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users", debounced],
    queryFn: () => list({ data: { q: debounced || undefined } }),
  });

  const roleMut = useMutation({
    mutationFn: (v: { targetUserId: string; newRole: "super_admin" | "admin" | "user" }) =>
      setRole({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (user_id: string) => del({ data: { user_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Search, assign roles, and remove accounts.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by display name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => setDebounced(q)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setDebounced(q);
          }}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={() => setDebounced(q)}>
          Search
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
        </div>
      )}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      <div className="grid gap-2">
        {(() => {
          const users = data ?? [];
          const currentUserObj = users.find(u => u.user_id === currentUser?.id);
          const remainingUsers = users.filter(u => u.user_id !== currentUser?.id);
          const orderedUsers = currentUserObj ? [currentUserObj, ...remainingUsers] : remainingUsers;

          return orderedUsers.map((u) => (
            <Card key={u.user_id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-3 min-w-0">
                      {u.username && <span className="truncate font-bold">{u.username}</span>}
                      {u.display_name && (!u.username || u.display_name.trim().toLowerCase() !== u.username.trim().toLowerCase()) && (
                        <span className="truncate font-normal">{u.display_name}</span>
                      )}
                      {!u.username && !u.display_name && (
                        <span className="truncate font-bold">Unnamed user</span>
                      )}
                    </div>
                    {/* @ts-ignore - email might not be typed yet */}
                    {u.email && (
                      <span className="truncate text-xs text-muted-foreground">{u.email}</span>
                    )}
                  </div>
                  {u.roles.map((r) => (
                    <Badge
                      key={r}
                      variant={r === "admin" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {r}
                    </Badge>
                  ))}
                {!u.onboarding_completed && (
                  <Badge variant="outline" className="text-[10px]">
                    onboarding
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>Joined {format(new Date(u.created_at), "PP")}</span>
                {u.target_country && <span>{u.target_country}</span>}
                {u.target_intake && <span>Intake: {u.target_intake}</span>}
                <span>Streak: {u.streak.current}d</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {currentUser?.id === u.user_id ? (
                <Badge variant="outline" className="mr-2">
                  Current Account
                </Badge>
              ) : u.roles.includes("super_admin") ? (
                <Badge variant="secondary" className="mr-2">
                  Super Admin
                </Badge>
              ) : isSuperAdmin ? (
                <>
                  {(() => {
                    const dominantRole = u.roles.includes("admin") ? "admin" : "user";

                    return (
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
                          {dominantRole === "user" && (
                            <DropdownMenuItem
                              onClick={() =>
                                roleMut.mutate({ targetUserId: u.user_id, newRole: "admin" })
                              }
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              Promote to Admin
                            </DropdownMenuItem>
                          )}
                          {dominantRole === "admin" && (
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
                                  roleMut.mutate({
                                    targetUserId: u.user_id,
                                    newRole: "super_admin",
                                  })
                                }
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Promote to Super Admin
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  })()}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes the account and all their data. This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => delMut.mutate(u.user_id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : null}
            </div>
          </Card>
        ))})()}
        {!isLoading && (data ?? []).length === 0 && (
          <Card className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <UserCog className="h-4 w-4" /> No users matched.
          </Card>
        )}
      </div>
    </div>
  );
}
