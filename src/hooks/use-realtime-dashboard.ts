/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeDashboard() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel("admin-dashboard");

    // profiles (Total Users & Latest Registrations)
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "profiles" },
      (payload) => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            totalUsers: old.totalUsers + 1,
            recentRegistrations: [
              {
                user_id: payload.new.user_id,
                display_name: payload.new.display_name,
                created_at: payload.new.created_at || new Date().toISOString(),
              },
              ...old.recentRegistrations,
            ].slice(0, 8),
          };
        });
      },
    );

    // login_history (DAU, WAU, MAU)
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "login_history" },
      () => {
        qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      },
    );

    // ai_usage
    channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_usage" }, () => {
      qc.setQueryData(["admin", "stats"], (old: any) => {
        if (!old) return old;
        return { ...old, aiRequests: old.aiRequests + 1 };
      });
    });

    // document_reviews
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "document_reviews" },
      () => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          return { ...old, ocrRequests: old.ocrRequests + 1 };
        });
      },
    );

    // daily_checkins
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "daily_checkins" },
      () => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          return { ...old, germanChecks: old.germanChecks + 1 };
        });
      },
    );

    // ielts_practice
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "ielts_practice" },
      () => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          return { ...old, ieltsSessions: old.ieltsSessions + 1 };
        });
      },
    );

    // dmat_mock_tests
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "dmat_mock_tests" },
      () => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          return { ...old, dmatSessions: old.dmatSessions + 1 };
        });
      },
    );

    // search_history
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "search_history" },
      () => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          return { ...old, uniSearches: old.uniSearches + 1 };
        });
      },
    );

    // feedback_items
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "feedback_items" },
      () => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          return { ...old, feedbackCount: old.feedbackCount + 1 };
        });
      },
    );

    // blog_posts
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "blog_posts" },
      (payload) => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          const wasPublished = payload.old?.is_published;
          const isPublished = payload.new?.is_published;
          let diff = 0;
          if (!wasPublished && isPublished) diff = 1;
          if (wasPublished && !isPublished) diff = -1;

          return { ...old, blogPublished: old.blogPublished + diff };
        });
      },
    );
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "blog_posts" },
      (payload) => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          if (payload.new?.is_published) {
            return { ...old, blogPublished: old.blogPublished + 1 };
          }
          return old;
        });
      },
    );

    // notifications
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      () => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          return { ...old, notificationsSent: old.notificationsSent + 1 };
        });
      },
    );

    // audit_log (Recent Activity)
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "audit_log" },
      (payload) => {
        qc.setQueryData(["admin", "stats"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            recentActivity: [
              {
                id: payload.new.id,
                user_id: payload.new.user_id,
                action: payload.new.action,
                entity: payload.new.entity,
                created_at: payload.new.created_at || new Date().toISOString(),
              },
              ...old.recentActivity,
            ].slice(0, 15),
          };
        });
      },
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
