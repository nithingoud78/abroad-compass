// Cross-module workflow automation. Every mutation site can call these
// helpers after a successful Supabase write to keep tasks, notifications,
// budget alerts and document checklists in sync without DB triggers.
import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/notifications";
import { differenceInDays, format } from "date-fns";

type UniversityRow = {
  id: string;
  name: string;
  deadline: string | null;
  aps_required: boolean | null;
};

// Generate the canonical application checklist for a newly-added university.
export async function onUniversityCreated(userId: string, uni: UniversityRow) {
  const baseTitles = [
    "Draft Statement of Purpose (SOP)",
    "Request 2 Letters of Recommendation",
    "Order official transcripts",
    "Translate transcripts (German + English)",
    "Prepare CV in Europass format",
    "Submit application on uni-assist / portal",
    "Pay application fee",
    "Plan visa application",
  ];
  if (uni.aps_required) baseTitles.unshift("Submit APS certificate");

  const rows = baseTitles.map((title, i) => ({
    user_id: userId,
    title,
    module: "university" as const,
    status: "pending" as const,
    priority: i < 2 ? "high" : "normal",
    related_id: uni.id,
    due_date: uni.deadline,
    position: i,
    labels: [uni.name],
  }));
  await supabase.from("tasks").insert(rows);

  if (uni.deadline) {
    const days = differenceInDays(new Date(uni.deadline), new Date());
    await notify({
      user_id: userId,
      type: "application",
      title: `Application checklist created for ${uni.name}`,
      body:
        days > 0
          ? `Deadline in ${days} days (${format(new Date(uni.deadline), "PP")})`
          : "Deadline already passed — review urgently.",
      link: "/university",
      priority: days < 30 ? "high" : "normal",
      metadata: { university_id: uni.id },
    });
  }
}

// When a document is uploaded, mark matching pending application tasks done.
export async function onDocumentUploaded(userId: string, name: string, category: string) {
  const term = `%${name.split(/\s+/)[0]}%`;
  await supabase
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "pending")
    .ilike("title", term);
  await notify({
    user_id: userId,
    type: "document",
    title: `${name} uploaded`,
    body: `Filed under ${category}. Related checklist items were marked complete.`,
    link: "/germany-journey",
    priority: "low",
  });
}

// Celebrate certificate additions and bump profile completion.
export async function onCertificateAdded(userId: string, certType: string, score: string | null) {
  await notify({
    user_id: userId,
    type: "portfolio",
    title: `${certType} added to your profile`,
    body: score
      ? `Score: ${score}. Your profile completeness just improved.`
      : "Profile completeness improved.",
    link: "/portfolio",
    priority: "normal",
  });
}

// Alert when a single expense pushes monthly spend over the goal.
export async function onBudgetEntry(userId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  const { data: rows } = await supabase
    .from("budget_entries")
    .select("amount, kind")
    .eq("user_id", userId)
    .gte("occurred_on", monthStart.toISOString().slice(0, 10));
  if (!rows) return;
  const expense = rows
    .filter((r) => r.kind === "expense")
    .reduce((s, r) => s + Number(r.amount), 0);
  const { data: goal } = await supabase
    .from("savings_goals")
    .select("target_amount")
    .eq("user_id", userId)
    .maybeSingle();
  if (goal?.target_amount && expense > Number(goal.target_amount) * 0.9) {
    await notify({
      user_id: userId,
      type: "budget",
      title: "Monthly spend approaching limit",
      body: `You've spent ${Math.round(expense)} this month — close to your goal.`,
      link: "/budget",
      priority: "high",
    });
  }
}

// Vocabulary review or study session: bump streak heads-up.
export async function onStudyActivity(userId: string, kind: "vocab" | "session") {
  if (kind === "vocab") return; // streak is handled by daily check-in trigger
  await notify({
    user_id: userId,
    type: "study",
    title: "Study session logged",
    body: "Keep going — daily consistency compounds.",
    link: "/check-in",
    priority: "low",
  });
}
