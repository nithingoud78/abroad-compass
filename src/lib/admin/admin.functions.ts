import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureAdmin(ctx: any) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/** Bootstrap: the first user to call this becomes admin if no admin exists yet. */
export const claimAdminIfNone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { granted: false, reason: "admin_exists" as const };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { granted: true };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const week = new Date(Date.now() - 7 * 864e5);
    const month = new Date(Date.now() - 30 * 864e5);

    const [
      { count: totalUsers },
      { count: dau },
      { count: wau },
      { count: mau },
      { count: aiRequests },
      { count: ocrRequests },
      { count: germanChecks },
      { count: ieltsSessions },
      { count: dmatSessions },
      { count: uniSearches },
      { count: feedbackCount },
      { count: blogPublished },
      { count: notificationsSent },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id", { count: "exact", head: true }),
      supabaseAdmin
        .from("login_history")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today.toISOString()),
      supabaseAdmin
        .from("login_history")
        .select("id", { count: "exact", head: true })
        .gte("created_at", week.toISOString()),
      supabaseAdmin
        .from("login_history")
        .select("id", { count: "exact", head: true })
        .gte("created_at", month.toISOString()),
      supabaseAdmin.from("ai_usage").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("document_reviews").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("daily_checkins").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("ielts_practice").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("dmat_mock_tests").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("search_history").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("feedback_items").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      supabaseAdmin.from("notifications").select("id", { count: "exact", head: true }),
    ]);

    const { data: recentRegistrations } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    const { data: recentActivity } = await supabaseAdmin
      .from("audit_log")
      .select("id, user_id, action, entity, created_at")
      .order("created_at", { ascending: false })
      .limit(15);

    return {
      totalUsers: totalUsers ?? 0,
      dau: dau ?? 0,
      wau: wau ?? 0,
      mau: mau ?? 0,
      aiRequests: aiRequests ?? 0,
      ocrRequests: ocrRequests ?? 0,
      germanChecks: germanChecks ?? 0,
      ieltsSessions: ieltsSessions ?? 0,
      dmatSessions: dmatSessions ?? 0,
      uniSearches: uniSearches ?? 0,
      feedbackCount: feedbackCount ?? 0,
      blogPublished: blogPublished ?? 0,
      notificationsSent: notificationsSent ?? 0,
      recentRegistrations: recentRegistrations ?? [],
      recentActivity: recentActivity ?? [],
    };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ q: z.string().optional() }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("profiles")
      .select(
        "user_id, display_name, avatar_url, onboarding_completed, created_at, target_country, target_intake",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.q) query = query.ilike("display_name", `%${data.q}%`);
    const { data: profiles, error } = await query;
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p) => p.user_id);
    const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
    const [{ data: roles }, { data: streaks }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", safeIds),
      supabaseAdmin
        .from("streaks")
        .select("user_id, current_streak, last_checkin_date")
        .in("user_id", safeIds),
    ]);
    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    });
    const streakByUser = new Map<string, { current: number; last: string | null }>();
    (streaks ?? []).forEach((s) =>
      streakByUser.set(s.user_id, {
        current: s.current_streak ?? 0,
        last: s.last_checkin_date ?? null,
      }),
    );

    return (profiles ?? []).map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name ?? null,
      avatar_url: p.avatar_url ?? null,
      onboarding_completed: !!p.onboarding_completed,
      created_at: p.created_at,
      target_country: p.target_country ?? null,
      target_intake: p.target_intake ?? null,
      roles: rolesByUser.get(p.user_id) ?? [],
      streak: streakByUser.get(p.user_id) ?? { current: 0, last: null },
    }));
  });

const RoleMutInput = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "moderator", "user"]),
  grant: z.boolean(),
});

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RoleMutInput.parse(raw))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
    } else {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
    }
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: data.grant ? "role_granted" : "role_revoked",
      entity: "user_roles",
      entity_id: data.user_id,
      details: { role: data.role } as never,
    });
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ user_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    if (data.user_id === context.userId) throw new Error("Refusing to delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "user_deleted",
      entity: "auth.users",
      entity_id: data.user_id,
    });
    return { ok: true };
  });
