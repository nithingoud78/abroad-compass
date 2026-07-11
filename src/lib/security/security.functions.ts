import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

const EventInput = z.object({
  event: z.enum([
    "signed_in",
    "signed_out",
    "password_changed",
    "mfa_enrolled",
    "mfa_unenrolled",
    "mfa_challenge_failed",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const recordLoginEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => EventInput.parse(raw))
  .handler(async ({ data, context }) => {
    const ua = getRequestHeader("user-agent") ?? null;
    const xff = getRequestHeader("x-forwarded-for") ?? getRequestHeader("cf-connecting-ip") ?? null;
    const ip = xff ? xff.split(",")[0].trim() : null;
    const { error } = await context.supabase.from("login_history").insert({
      user_id: context.userId,
      event: data.event,
      user_agent: ua,
      ip,
      metadata: (data.metadata ?? {}) as unknown as Json,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listLoginHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("login_history")
      .select("id,event,user_agent,ip,created_at,metadata")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      event: r.event as string,
      user_agent: (r.user_agent as string | null) ?? null,
      ip: r.ip == null ? null : String(r.ip),
      created_at: r.created_at as string,
      metadata: r.metadata as Json,
    }));
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("audit_log")
      .select("id,action,entity,entity_id,details,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const AuditInput = z.object({
  action: z.string().min(1).max(120),
  entity: z.string().max(120).optional(),
  entity_id: z.string().max(120).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const writeAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => AuditInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("audit_log").insert({
      user_id: context.userId,
      action: data.action,
      entity: data.entity ?? null,
      entity_id: data.entity_id ?? null,
      details: (data.details ?? {}) as unknown as Json,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Sign out on all other devices — uses the user's own signOut scope. */
export const revokeOtherSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.auth.signOut({ scope: "others" });
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      user_id: context.userId,
      action: "revoke_other_sessions",
    });
    return { ok: true };
  });

/** Generate 10 backup codes; store hashes, return plaintext once. */
export const regenerateBackupCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const crypto = await import("crypto");
    const codes: string[] = [];
    const rows: { user_id: string; code_hash: string }[] = [];
    for (let i = 0; i < 10; i++) {
      const raw = crypto.randomBytes(5).toString("hex");
      const pretty = `${raw.slice(0, 5)}-${raw.slice(5)}`;
      codes.push(pretty);
      rows.push({
        user_id: context.userId,
        code_hash: crypto.createHash("sha256").update(pretty).digest("hex"),
      });
    }
    await context.supabase.from("mfa_backup_codes").delete().eq("user_id", context.userId);
    const { error } = await context.supabase.from("mfa_backup_codes").insert(rows);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      user_id: context.userId,
      action: "backup_codes_regenerated",
    });
    return { codes };
  });

export const countBackupCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await context.supabase
      .from("mfa_backup_codes")
      .select("id", { count: "exact", head: true })
      .is("used_at", null)
      .eq("user_id", context.userId);
    return { unused: count ?? 0 };
  });
