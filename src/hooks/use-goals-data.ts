/**
 * Centralized Goals Data Hook
 *
 * Single source of truth for all user goals:
 *  - targets (German, Budget, University, Timeline)
 *  - ielts_settings (IELTS targets + exam dates)
 *  - dmat_settings (dMAT target score + exam override)
 *
 * Uses Supabase Realtime so every subscribed page updates instantly
 * when Goals are saved — no manual refresh, no window reload.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Tables } from "@/integrations/supabase/types";

export type TargetsRow = Tables<"targets">;
export type IeltsSettingsRow = Tables<"ielts_settings">;
export type DmatSettingsRow = Tables<"dmat_settings">;
export type GoetheSettingsRow = Tables<"goethe_settings">;
export type AdminExamScheduleRow = Tables<"admin_exam_schedule">;

export type GoalsData = {
  loading: boolean;
  targets: TargetsRow | null;
  ieltsSettings: IeltsSettingsRow | null;
  dmatSettings: DmatSettingsRow | null;
  goetheSettings: GoetheSettingsRow | null;
  adminSchedule: AdminExamScheduleRow | null;
  reload: () => void;
};

export function useGoalsData(): GoalsData {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<TargetsRow | null>(null);
  const [ieltsSettings, setIeltsSettings] = useState<IeltsSettingsRow | null>(null);
  const [dmatSettings, setDmatSettings] = useState<DmatSettingsRow | null>(null);
  const [goetheSettings, setGoetheSettings] = useState<GoetheSettingsRow | null>(null);
  const [adminSchedule, setAdminSchedule] = useState<AdminExamScheduleRow | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [tRes, iRes, dRes, gRes, aRes] = await Promise.all([
      supabase.from("targets").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("ielts_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("dmat_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("goethe_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("admin_exam_schedule").select("*").eq("is_active", true).maybeSingle(),
    ]);
    setTargets(tRes.data ?? null);
    setIeltsSettings(iRes.data ?? null);
    setDmatSettings(dRes.data ?? null);
    setGoetheSettings(gRes.data ?? null);
    setAdminSchedule(aRes.data ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();

    // Subscribe to real-time changes on all three user tables
    const channel = supabase
      .channel(`goals-sync-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "targets", filter: `user_id=eq.${user.id}` },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ielts_settings", filter: `user_id=eq.${user.id}` },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dmat_settings", filter: `user_id=eq.${user.id}` },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goethe_settings", filter: `user_id=eq.${user.id}` },
        load,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_exam_schedule" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return {
    loading,
    targets,
    ieltsSettings,
    dmatSettings,
    goetheSettings,
    adminSchedule,
    reload: load,
  };
}
