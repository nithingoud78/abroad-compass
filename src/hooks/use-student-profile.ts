import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { StudentProfile } from "@/lib/acceptance";

// Aggregates the signed-in user's academic snapshot used by the
// Acceptance Chance engine. Pulls from profiles, education, certificates,
// projects, semester_subjects.
export function useStudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [p, e, certs, projects, subjects] = await Promise.all([
        supabase
          .from("profiles")
          .select("current_german_level, target_degree")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("education")
          .select("ug_cgpa, total_credits, intermediate")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("certificates").select("cert_type, score").eq("user_id", user.id),
        supabase.from("projects").select("id").eq("user_id", user.id),
        supabase.from("semester_subjects").select("name, grade").eq("user_id", user.id),
      ]);
      if (cancelled) return;

      // Pull English test band from certificates if present (IELTS/TOEFL).
      let english: StudentProfile["englishScore"] = null;
      const englishCert = (certs.data ?? []).find((c) => /ielts|toefl/i.test(c.cert_type ?? ""));
      if (englishCert?.score) {
        const band = parseFloat(englishCert.score);
        if (!Number.isNaN(band)) {
          english = {
            test: /ielts/i.test(englishCert.cert_type) ? "IELTS" : "TOEFL",
            band,
          };
        }
      }
      const apsDone = (certs.data ?? []).some((c) => /aps/i.test(c.cert_type ?? ""));

      // Backlogs = subjects with F / Fail / 0 grade.
      const backlogs = (subjects.data ?? []).filter((s) =>
        /^(f|fail|0)$/i.test((s.grade ?? "").trim()),
      ).length;

      setProfile({
        cgpa: e.data?.ug_cgpa ?? null,
        totalCredits: e.data?.total_credits ?? null,
        germanLevel: p.data?.current_german_level ?? null,
        englishScore: english,
        apsDone,
        bachelorSubject: p.data?.target_degree ?? e.data?.intermediate ?? null,
        completedSubjects: (subjects.data ?? []).map((s) => s.name),
        certificates: (certs.data ?? []).length,
        projects: (projects.data ?? []).length,
        backlogs,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { profile, loading };
}
