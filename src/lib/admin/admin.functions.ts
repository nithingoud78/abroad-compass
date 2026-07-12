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

export const testAiConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { provider: string; model: string; apiKey?: string; baseUrl?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);

    try {
      const { provider, apiKey, baseUrl } = data;
      if (!apiKey) throw new Error("API Key is missing");

      let url = "";
      let headers: HeadersInit = {};

      if (provider === "google") {
        url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      } else if (provider === "openrouter") {
        url = "https://openrouter.ai/api/v1/models";
        headers = { Authorization: `Bearer ${apiKey}` };
      } else if (provider === "openai") {
        url = "https://api.openai.com/v1/models";
        headers = { Authorization: `Bearer ${apiKey}` };
      } else if (provider === "custom") {
        if (!baseUrl) throw new Error("Base URL is required for custom provider");
        url = `${baseUrl.replace(/\/+$/, "")}/models`;
        headers = { Authorization: `Bearer ${apiKey}` };
      } else {
        throw new Error("Unsupported provider");
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        let errorMsg = res.statusText;
        try {
          const body = await res.json();
          errorMsg = body.error?.message || JSON.stringify(body);
        } catch (e) {
          // ignore
        }
        throw new Error(`API returned ${res.status}: ${errorMsg}`);
      }

      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error)?.message || "Unknown error" };
    }
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: stats, error } = await supabaseAdmin.rpc("get_admin_analytics");
    if (error) {
      console.error("Error fetching admin stats:", error);
    }

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
      totalUsers: stats?.totalUsers ?? 0,
      dau: stats?.dau ?? 0,
      wau: stats?.wau ?? 0,
      mau: stats?.mau ?? 0,
      aiRequests: stats?.aiRequests ?? 0,
      ocrRequests: stats?.ocrRequests ?? 0,
      germanChecks: stats?.germanChecks ?? 0,
      ieltsSessions: stats?.ieltsSessions ?? 0,
      dmatSessions: stats?.dmatSessions ?? 0,
      uniSearches: stats?.uniSearches ?? 0,
      feedbackCount: stats?.feedbackCount ?? 0,
      blogPublished: stats?.blogPublished ?? 0,
      notificationsSent: stats?.notificationsSent ?? 0,
      recentRegistrations: recentRegistrations ?? [],
      recentActivity: recentActivity ?? [],
    };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ q: z.string().optional() }).parse(raw ?? {}))
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
    const [{ data: roles }, { data: checkins }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", safeIds),
      supabaseAdmin.from("daily_checkins").select("user_id, checkin_date").in("user_id", safeIds),
    ]);
    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    });

    // Group checkins by user
    const checkinsByUser = new Map<string, string[]>();
    (checkins ?? []).forEach((c) => {
      if (!c.checkin_date) return;

      let normDateStr = c.checkin_date;
      if (normDateStr.includes("T") || normDateStr.includes(" ")) {
        // If it's a timestamp, just take the date portion as a simple fallback
        // on the server since we don't have the user's timezone handy.
        normDateStr = normDateStr.substring(0, 10);
      } else {
        normDateStr = normDateStr.substring(0, 10);
      }

      const list = checkinsByUser.get(c.user_id) ?? [];
      list.push(normDateStr);
      checkinsByUser.set(c.user_id, list);
    });

    const streakByUser = new Map<string, { current: number; last: string | null }>();
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 864e5).toISOString().split("T")[0];

    for (const [userId, dates] of checkinsByUser.entries()) {
      const sortedDates = [...new Set(dates)].sort().reverse();
      let currentStreak = 0;

      const parseLocal = (dStr: string) => {
        const [y, m, d] = dStr.split("-").map(Number);
        return new Date(y, m - 1, d);
      };

      if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
        let current = parseLocal(sortedDates[0]);
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const expectedPrev = new Date(current.getTime() - 864e5).toISOString().split("T")[0];
          if (sortedDates[i] === expectedPrev) {
            currentStreak++;
            current = new Date(current.getTime() - 864e5);
          } else {
            break;
          }
        }
      }

      streakByUser.set(userId, { current: currentStreak, last: sortedDates[0] });
    }

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

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ user_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await ensureSuperAdmin(context);
    if (data.user_id === context.userId)
      throw new Error("You cannot delete your own Super Admin account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: currentRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id);
    const isCurrentlySuperAdmin = currentRoles?.some((r) => r.role === "super_admin");
    if (isCurrentlySuperAdmin) throw new Error("Super Admins cannot be deleted.");

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

// ─── FEEDBACK ────────────────────────────────────────────────────────────────

const FeedbackListInput = z.object({
  status: z.string().optional(),
  kind: z.string().optional(),
  priority: z.string().optional(),
  q: z.string().optional(),
  page: z.number().int().min(0).default(0),
});

export const adminFeedbackList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => FeedbackListInput.parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const PAGE_SIZE = 25;
    let query = supabaseAdmin
      .from("feedback_items")
      .select(
        "id, title, description, kind, status, priority, vote_count, created_at, user_id, internal_notes, developer_notes, assignee",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(data.page * PAGE_SIZE, (data.page + 1) * PAGE_SIZE - 1);

    if (data.status) query = query.eq("status", data.status);
    if (data.kind) query = query.eq("kind", data.kind);
    if (data.priority) query = query.eq("priority", data.priority);
    if (data.q) query = query.ilike("title", `%${data.q}%`);

    const { data: items, error, count } = await query;
    if (error) throw new Error(error.message);
    return { items: items ?? [], total: count ?? 0, page: data.page, pageSize: PAGE_SIZE };
  });

const FeedbackUpdateInput = z.object({
  id: z.string().uuid(),
  status: z.string().optional(),
  priority: z.string().optional(),
  internal_notes: z.string().optional(),
  developer_notes: z.string().optional(),
  assignee: z.string().optional(),
});

export const adminFeedbackUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => FeedbackUpdateInput.parse(raw))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...updates } = data;
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.internal_notes !== undefined) payload.internal_notes = updates.internal_notes;
    if (updates.developer_notes !== undefined) payload.developer_notes = updates.developer_notes;
    if (updates.assignee !== undefined) payload.assignee = updates.assignee;

    const { error } = await supabaseAdmin
      .from("feedback_items")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(payload as any)
      .eq("id", id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "feedback_updated",
      entity: "feedback_items",
      entity_id: id,
      details: payload as never,
    });
    return { ok: true };
  });

// ─── BLOG ────────────────────────────────────────────────────────────────────

const BlogListInput = z.object({
  status: z.enum(["all", "published", "draft", "scheduled"]).default("all"),
  q: z.string().optional(),
  page: z.number().int().min(0).default(0),
});

export const adminBlogList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => BlogListInput.parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const PAGE_SIZE = 20;
    let query = supabaseAdmin
      .from("blog_posts")
      .select(
        "id, title, slug, category, is_published, featured, scheduled_for, created_at, updated_at, reading_minutes, tags, author_name",
        { count: "exact" },
      )
      .order("updated_at", { ascending: false })
      .range(data.page * PAGE_SIZE, (data.page + 1) * PAGE_SIZE - 1);

    if (data.status === "published") query = query.eq("is_published", true);
    if (data.status === "draft") query = query.eq("is_published", false).is("scheduled_for", null);
    if (data.status === "scheduled") query = query.not("scheduled_for", "is", null);
    if (data.q) query = query.ilike("title", `%${data.q}%`);

    const { data: posts, error, count } = await query;
    if (error) throw new Error(error.message);
    return { posts: posts ?? [], total: count ?? 0, page: data.page, pageSize: PAGE_SIZE };
  });

export const adminBlogGet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return post;
  });

const BlogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  body_md: z.string().min(1),
  category: z.string().default("general"),
  tags: z.array(z.string()).default([]),
  is_published: z.boolean().default(false),
  featured: z.boolean().default(false),
  cover_url: z.string().nullable().optional(),
  featured_image: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  scheduled_for: z.string().nullable().optional(),
  author_name: z.string().default("Abroad Compass Team"),
});

export const adminBlogCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => BlogPostSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const words = data.body_md.split(/\s+/).length;
    const reading_minutes = Math.max(1, Math.ceil(words / 200));
    const { data: post, error } = await supabaseAdmin
      .from("blog_posts")
      .insert({ ...data, reading_minutes })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "blog_created",
      entity: "blog_posts",
      entity_id: post.id,
      details: { title: data.title } as never,
    });
    return { id: post.id };
  });

const BlogUpdateSchema = BlogPostSchema.partial().extend({ id: z.string().uuid() });

export const adminBlogUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => BlogUpdateSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, body_md, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
    if (body_md !== undefined) {
      payload.body_md = body_md;
      payload.reading_minutes = Math.max(1, Math.ceil(body_md.split(/\s+/).length / 200));
    }

    const { error } = await supabaseAdmin
      .from("blog_posts")
      .update(payload as never)
      .eq("id", id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "blog_updated",
      entity: "blog_posts",
      entity_id: id,
      details: payload as never,
    });
    return { ok: true };
  });

export const adminBlogDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "blog_deleted",
      entity: "blog_posts",
      entity_id: data.id,
    });
    return { ok: true };
  });

// ─── AI SETTINGS ─────────────────────────────────────────────────────────────

export const adminAiSettingsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("ai_provider_settings")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const AiSettingsUpdateSchema = z.object({
  id: z.string().uuid(),
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).optional(),
  streaming: z.boolean().optional(),
  is_active: z.boolean().optional(),
  system_prompt: z.string().nullable().optional(),
  top_p: z.number().min(0).max(1).optional(),
  memory_size: z.number().int().min(0).optional(),
});

export const adminAiSettingsUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => AiSettingsUpdateSchema.parse(raw))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...updates } = data;
    const { error } = await supabaseAdmin
      .from("ai_provider_settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAiUsageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 864e5).toISOString();

    const [
      { data: usageRows },
      { data: errorRows },
      { count: totalRequests },
      { data: modelRows },
    ] = await Promise.all([
      supabaseAdmin
        .from("ai_usage")
        .select("created_at, tokens_in, tokens_out, status, model")
        .gte("created_at", since)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("ai_usage")
        .select("id, model, error, created_at")
        .eq("status", "error")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin.from("ai_usage").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("ai_usage")
        .select("model, tokens_in, tokens_out")
        .gte("created_at", since),
    ]);

    // aggregate by day
    const byDay: Record<
      string,
      { date: string; requests: number; tokens_in: number; tokens_out: number }
    > = {};
    (usageRows ?? []).forEach((r) => {
      const d = r.created_at.slice(0, 10);
      if (!byDay[d]) byDay[d] = { date: d, requests: 0, tokens_in: 0, tokens_out: 0 };
      byDay[d].requests++;
      byDay[d].tokens_in += r.tokens_in ?? 0;
      byDay[d].tokens_out += r.tokens_out ?? 0;
    });

    // aggregate by model
    const byModel: Record<string, { model: string; requests: number; tokens: number }> = {};
    (modelRows ?? []).forEach((r) => {
      if (!byModel[r.model]) byModel[r.model] = { model: r.model, requests: 0, tokens: 0 };
      byModel[r.model].requests++;
      byModel[r.model].tokens += (r.tokens_in ?? 0) + (r.tokens_out ?? 0);
    });

    return {
      totalRequests: totalRequests ?? 0,
      daily: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
      byModel: Object.values(byModel).sort((a, b) => b.requests - a.requests),
      errors: errorRows ?? [],
    };
  });

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
    const since7 = new Date(Date.now() - 7 * 864e5).toISOString();

    const [
      { data: logins30 },
      { data: logins7 },
      { data: newUsers30 },
      { data: feedbackByStatus },
      { data: blogStats },
      { data: aiUsage30 },
      { data: germanCheckins },
    ] = await Promise.all([
      supabaseAdmin
        .from("login_history")
        .select("created_at, user_id")
        .gte("created_at", since30)
        .order("created_at", { ascending: true }),
      supabaseAdmin.from("login_history").select("created_at, user_id").gte("created_at", since7),
      supabaseAdmin
        .from("profiles")
        .select("created_at")
        .gte("created_at", since30)
        .order("created_at", { ascending: true }),
      supabaseAdmin.from("feedback_items").select("status"),
      supabaseAdmin.from("blog_posts").select("is_published, reading_minutes, created_at"),
      supabaseAdmin
        .from("ai_usage")
        .select("created_at, tokens_in, tokens_out")
        .gte("created_at", since30)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("daily_checkins")
        .select("checkin_date, learned")
        .gte("checkin_date", since30.slice(0, 10)),
    ]);

    // DAU by day (30d)
    const dauByDay: Record<string, Set<string>> = {};
    (logins30 ?? []).forEach((r) => {
      const d = r.created_at.slice(0, 10);
      if (!dauByDay[d]) dauByDay[d] = new Set();
      dauByDay[d].add(r.user_id);
    });
    const dau = Object.entries(dauByDay)
      .map(([date, users]) => ({ date, users: users.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // New users by day (30d)
    const newByDay: Record<string, number> = {};
    (newUsers30 ?? []).forEach((r) => {
      const d = r.created_at.slice(0, 10);
      newByDay[d] = (newByDay[d] ?? 0) + 1;
    });
    const newUsers = Object.entries(newByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Feedback by status
    const fbStatus: Record<string, number> = {};
    (feedbackByStatus ?? []).forEach((r) => {
      fbStatus[r.status] = (fbStatus[r.status] ?? 0) + 1;
    });

    // AI tokens by day
    const aiByDay: Record<string, { date: string; tokens: number; requests: number }> = {};
    (aiUsage30 ?? []).forEach((r) => {
      const d = r.created_at.slice(0, 10);
      if (!aiByDay[d]) aiByDay[d] = { date: d, tokens: 0, requests: 0 };
      aiByDay[d].tokens += (r.tokens_in ?? 0) + (r.tokens_out ?? 0);
      aiByDay[d].requests++;
    });
    const aiDaily = Object.values(aiByDay).sort((a, b) => a.date.localeCompare(b.date));

    // German checkins by day
    const germanByDay: Record<string, number> = {};
    (germanCheckins ?? []).forEach((r) => {
      if (r.learned) germanByDay[r.checkin_date] = (germanByDay[r.checkin_date] ?? 0) + 1;
    });
    const germanDaily = Object.entries(germanByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const wauUnique = new Set((logins7 ?? []).map((r) => r.user_id)).size;

    return {
      dau,
      newUsers,
      wauUnique,
      feedbackByStatus: fbStatus,
      blogTotal: (blogStats ?? []).length,
      blogPublished: (blogStats ?? []).filter((b) => b.is_published).length,
      aiDaily,
      germanDaily,
    };
  });

// ─── LOGS ────────────────────────────────────────────────────────────────────

const LogsInput = z.object({
  type: z.enum(["audit", "auth", "ai"]).default("audit"),
  q: z.string().optional(),
  page: z.number().int().min(0).default(0),
});

type LogsResult =
  | {
      type: "audit";
      rows: {
        id: string;
        action: string;
        entity: string | null;
        entity_id: string | null;
        user_id: string;
        created_at: string;
        details: string;
      }[];
      total: number;
    }
  | {
      type: "auth";
      rows: {
        id: string;
        event: string;
        user_id: string;
        ip: string | null;
        user_agent: string | null;
        created_at: string;
      }[];
      total: number;
    }
  | {
      type: "ai";
      rows: {
        id: string;
        model: string;
        capability: string | null;
        status: string;
        tokens_in: number | null;
        tokens_out: number | null;
        latency_ms: number | null;
        error: string | null;
        user_id: string;
        created_at: string;
      }[];
      total: number;
    };

export const adminLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => LogsInput.parse(raw ?? {}))
  .handler(async ({ context, data }): Promise<LogsResult> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const PAGE_SIZE = 50;
    const from = data.page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    if (data.type === "audit") {
      let query = supabaseAdmin
        .from("audit_log")
        .select("id, action, entity, entity_id, user_id, created_at, details", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (data.q) query = query.ilike("action", `%${data.q}%`);
      const { data: rows, error, count } = await query;
      if (error) throw new Error(error.message);
      const safeRows = (rows ?? []).map((r) => ({
        id: r.id,
        action: r.action,
        entity: r.entity ?? null,
        entity_id: r.entity_id ?? null,
        user_id: r.user_id,
        created_at: r.created_at,
        details: JSON.stringify(r.details ?? {}),
      }));
      return { rows: safeRows, total: count ?? 0, type: "audit" as const };
    }

    if (data.type === "auth") {
      let query = supabaseAdmin
        .from("login_history")
        .select("id, event, user_id, ip, user_agent, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (data.q) query = query.ilike("event", `%${data.q}%`);
      const { data: rows, error, count } = await query;
      if (error) throw new Error(error.message);
      const safeRows = (rows ?? []).map((r) => ({
        id: r.id,
        event: r.event,
        user_id: r.user_id,
        ip: r.ip != null ? String(r.ip) : null,
        user_agent: r.user_agent ?? null,
        created_at: r.created_at,
      }));
      return { rows: safeRows, total: count ?? 0, type: "auth" as const };
    }

    // ai
    let query = supabaseAdmin
      .from("ai_usage")
      .select(
        "id, model, capability, status, tokens_in, tokens_out, latency_ms, error, user_id, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.q) query = query.ilike("model", `%${data.q}%`);
    const { data: rows, error, count } = await query;
    if (error) throw new Error(error.message);
    const safeRows = (rows ?? []).map((r) => ({
      id: r.id,
      model: r.model,
      capability: r.capability ?? null,
      status: r.status,
      tokens_in: r.tokens_in ?? null,
      tokens_out: r.tokens_out ?? null,
      latency_ms: r.latency_ms ?? null,
      error: r.error ?? null,
      user_id: r.user_id,
      created_at: r.created_at,
    }));
    return { rows: safeRows, total: count ?? 0, type: "ai" as const };
  });

// ─── SYSTEM HEALTH ───────────────────────────────────────────────────────────

export const adminSystemHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const tables = [
      "profiles",
      "ai_usage",
      "ai_threads",
      "ai_messages",
      "blog_posts",
      "feedback_items",
      "audit_log",
      "login_history",
      "notifications",
      "daily_checkins",
      "documents",
    ];

    const counts = await Promise.all(
      tables.map((t) =>
        supabaseAdmin
          .from(t as never)
          .select("id" as never, { count: "exact", head: true })
          .then(({ count }) => ({ table: t, count: count ?? 0 })),
      ),
    );

    const { data: settingsRaw } = await supabaseAdmin
      .from("system_settings" as never)
      .select("key, value")
      .then((r) => r);

    const settings = ((settingsRaw ?? []) as Array<{ key: string; value: unknown }>).map((s) => ({
      key: s.key,
      value: JSON.stringify(s.value),
    }));

    return {
      tables: counts,
      settings,
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
    };
  });

export const adminSystemSettingUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ key: z.string(), value: z.unknown() }).parse(raw))
  .handler(async ({ context, data }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("system_settings" as never)
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() } as never, {
        onConflict: "key",
      });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "system_setting_updated",
      entity: "system_settings",
      details: { key: data.key } as never,
    });
    return { ok: true };
  });

// ─── ADMIN PROFILE ───────────────────────────────────────────────────────────

export const adminProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .single();
    const { data: activity } = await supabaseAdmin
      .from("audit_log")
      .select("id, action, entity, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    return { profile, activity: activity ?? [] };
  });

// ─── SUPER ADMIN MANAGEMENT ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureSuperAdmin(ctx: any) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden - Super Admin required");
}

export const adminListUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch all users with profiles
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, created_at, avatar_url");

    if (profileErr) throw new Error(profileErr.message);

    // Fetch all roles
    const { data: roles, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    if (roleErr) throw new Error(roleErr.message);

    const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]));

    const usersWithRoles = profiles?.map((p) => ({
      ...p,
      role: roleMap.get(p.user_id) || "user",
    }));

    return usersWithRoles ?? [];
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { targetUserId: string; newRole: "super_admin" | "admin" | "user" }) => d)
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context);
    const { targetUserId, newRole } = data;
    if (targetUserId === context.userId) {
      throw new Error("You cannot modify your own Super Admin account.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // If attempting to demote or remove a super_admin, verify safety
    if (newRole !== "super_admin") {
      const { data: currentRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId);
      const isCurrentlySuperAdmin = currentRoles?.some((r) => r.role === "super_admin");

      if (isCurrentlySuperAdmin) {
        throw new Error("Super Admins cannot be demoted.");
      }
    }

    if (newRole === "user") {
      // Demote to normal user by removing from user_roles
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId);
      if (error) throw new Error(error.message);
    } else {
      // Promote or change admin role
      const { data: existing } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabaseAdmin
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", targetUserId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: targetUserId, role: newRole });
        if (error) throw new Error(error.message);
      }
    }

    // Attempt audit logging
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: `role_change_to_${newRole}`,
      entity: "user_roles",
      details: { target: targetUserId } as never,
    });

    return { success: true };
  });
