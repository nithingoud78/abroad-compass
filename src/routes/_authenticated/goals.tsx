import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoalsData } from "@/hooks/use-goals-data";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Goals — Abroad Compass" }] }),
  component: GoalsPage,
});

function GoalsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // German
  const [germanLevel, setGermanLevel] = useState("A1");
  const [germanDate, setGermanDate] = useState("");

  // IELTS
  const [ieltsOverall, setIeltsOverall] = useState<number | "">("");
  const [ieltsListening, setIeltsListening] = useState<number | "">("");
  const [ieltsReading, setIeltsReading] = useState<number | "">("");
  const [ieltsWriting, setIeltsWriting] = useState<number | "">("");
  const [ieltsSpeaking, setIeltsSpeaking] = useState<number | "">("");

  // dMAT
  const [dmatScore, setDmatScore] = useState<number | "">("");

  // Goethe
  const [goetheLevel, setGoetheLevel] = useState("B2");
  const [goetheDate, setGoetheDate] = useState("");
  const [goetheWeekly, setGoetheWeekly] = useState<number | "">(5);

  // Budget
  const [budgetSavings, setBudgetSavings] = useState<number | "">("");
  const [budgetBlocked, setBudgetBlocked] = useState<number | "">("");
  const [budgetMonthly, setBudgetMonthly] = useState<number | "">("");

  // University
  const [uniDream, setUniDream] = useState("");
  const [uniIntakeSeason, setUniIntakeSeason] = useState("Winter");
  const [uniIntakeYear, setUniIntakeYear] = useState("");
  const [uniAppCount, setUniAppCount] = useState<number | "">("");
  const [uniAccCount, setUniAccCount] = useState<number | "">("");

  // Timeline
  const [timelinePassport, setTimelinePassport] = useState("");
  const [timelineAps, setTimelineAps] = useState("");
  const [timelineVisa, setTimelineVisa] = useState("");
  const [timelineAccomm, setTimelineAccomm] = useState("");
  const [timelineFlight, setTimelineFlight] = useState("");

  useEffect(() => {
    if (!user) return;
    async function load() {
      if (!user) return;
      setLoading(true);
      const [tRes, iRes, dRes, gRes] = await Promise.all([
        supabase.from("targets").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("ielts_settings").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("dmat_settings").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("goethe_settings").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (tRes.data) {
        setGermanLevel(tRes.data.german_level ?? "A1");
        setGermanDate(tRes.data.german_date ?? "");
        setBudgetSavings(tRes.data.budget_savings ?? "");
        setBudgetBlocked(tRes.data.budget_blocked_account ?? "");
        setBudgetMonthly(tRes.data.budget_monthly ?? "");
        setUniDream(tRes.data.uni_dream ?? "");
        setUniIntakeSeason(tRes.data.uni_intake_season ?? "Winter");
        setUniIntakeYear(tRes.data.uni_intake_year ?? "");
        setUniAppCount(tRes.data.uni_app_count ?? "");
        setUniAccCount(tRes.data.uni_acc_count ?? "");
        setTimelinePassport(tRes.data.timeline_passport_date ?? "");
        setTimelineAps(tRes.data.timeline_aps_date ?? "");
        setTimelineVisa(tRes.data.timeline_visa_date ?? "");
        setTimelineAccomm(tRes.data.timeline_accommodation_date ?? "");
        setTimelineFlight(tRes.data.timeline_flight_date ?? "");
      }

      if (iRes.data) {
        setIeltsOverall(iRes.data.target_overall ?? "");
        setIeltsListening(iRes.data.target_listening ?? "");
        setIeltsReading(iRes.data.target_reading ?? "");
        setIeltsWriting(iRes.data.target_writing ?? "");
        setIeltsSpeaking(iRes.data.target_speaking ?? "");
      }

      if (dRes.data) {
        setDmatScore(dRes.data.target_score ?? "");
      }

      if (gRes.data) {
        setGoetheLevel(gRes.data.target_level ?? "B2");
        setGoetheDate(gRes.data.exam_date ?? "");
        setGoetheWeekly(gRes.data.weekly_goal_hours ?? 5);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function saveGoals() {
    if (!user) return;
    setSaving(true);

    try {
      const [tRes, iRes, dRes, gRes] = await Promise.all([
        supabase.from("targets").upsert(
          {
            user_id: user.id,
            german_level: germanLevel,
            german_date: germanDate || null,
            budget_savings: budgetSavings === "" ? null : Number(budgetSavings),
            budget_blocked_account: budgetBlocked === "" ? null : Number(budgetBlocked),
            budget_monthly: budgetMonthly === "" ? null : Number(budgetMonthly),
            uni_dream: uniDream || null,
            uni_intake_season: uniIntakeSeason,
            uni_intake_year: uniIntakeYear || null,
            uni_app_count: uniAppCount === "" ? null : Number(uniAppCount),
            uni_acc_count: uniAccCount === "" ? null : Number(uniAccCount),
            timeline_passport_date: timelinePassport || null,
            timeline_aps_date: timelineAps || null,
            timeline_visa_date: timelineVisa || null,
            timeline_accommodation_date: timelineAccomm || null,
            timeline_flight_date: timelineFlight || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        ),
        supabase.from("ielts_settings").upsert(
          {
            user_id: user.id,
            target_overall: ieltsOverall === "" ? null : Number(ieltsOverall),
            target_listening: ieltsListening === "" ? null : Number(ieltsListening),
            target_reading: ieltsReading === "" ? null : Number(ieltsReading),
            target_writing: ieltsWriting === "" ? null : Number(ieltsWriting),
            target_speaking: ieltsSpeaking === "" ? null : Number(ieltsSpeaking),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        ),
        supabase.from("dmat_settings").upsert(
          {
            user_id: user.id,
            target_score: dmatScore === "" ? null : Number(dmatScore),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        ),
        supabase.from("goethe_settings").upsert(
          {
            user_id: user.id,
            target_level: goetheLevel,
            exam_date: goetheDate || null,
            weekly_goal_hours: goetheWeekly === "" ? null : Number(goetheWeekly),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        ),
      ]);

      if (tRes.error) throw tRes.error;
      if (iRes.error) throw iRes.error;
      if (dRes.error) throw dRes.error;
      if (gRes.error) throw gRes.error;

      toast.success("Goals saved successfully");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save goals";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <StandardPageLayout
      title="Your Goals"
      subtitle="Planning"
      actions={
        <Button onClick={saveGoals} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Goals
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Study Goals */}
        <Card className="shadow-card md:col-span-2">
          <CardHeader>
            <CardTitle>Study Goals</CardTitle>
            <CardDescription>Define your language and admission test goals</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">IELTS Targets</h3>
              <div className="space-y-2">
                <Label>Target Overall Band</Label>
                <Input
                  type="number"
                  step="0.5"
                  max="9"
                  min="0"
                  value={ieltsOverall}
                  placeholder="e.g. 7.5"
                  onChange={(e) =>
                    setIeltsOverall(e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Listening</Label>
                  <Input
                    type="number"
                    step="0.5"
                    max="9"
                    min="0"
                    value={ieltsListening}
                    placeholder="7.5"
                    onChange={(e) =>
                      setIeltsListening(e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Reading</Label>
                  <Input
                    type="number"
                    step="0.5"
                    max="9"
                    min="0"
                    value={ieltsReading}
                    placeholder="7.5"
                    onChange={(e) =>
                      setIeltsReading(e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Writing</Label>
                  <Input
                    type="number"
                    step="0.5"
                    max="9"
                    min="0"
                    value={ieltsWriting}
                    placeholder="7.0"
                    onChange={(e) =>
                      setIeltsWriting(e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Speaking</Label>
                  <Input
                    type="number"
                    step="0.5"
                    max="9"
                    min="0"
                    value={ieltsSpeaking}
                    placeholder="7.0"
                    onChange={(e) =>
                      setIeltsSpeaking(e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">TestAS (dMAT)</h3>
              <div className="space-y-2">
                <Label>Target Score</Label>
                <Input
                  type="number"
                  value={dmatScore}
                  onChange={(e) =>
                    setDmatScore(e.target.value === "" ? "" : parseInt(e.target.value))
                  }
                  placeholder="e.g. 110"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">German Language</h3>
              <div className="space-y-2">
                <Label>Target Level</Label>
                <Select value={germanLevel} onValueChange={setGermanLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={germanDate}
                  onChange={(e) => setGermanDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">Goethe / TELC</h3>
              <div className="space-y-2">
                <Label>Target Level</Label>
                <Select value={goetheLevel} onValueChange={setGoetheLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam Date</Label>
                <Input
                  type="date"
                  value={goetheDate}
                  onChange={(e) => setGoetheDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Weekly Goal (hrs)</Label>
                <Input
                  type="number"
                  value={goetheWeekly}
                  onChange={(e) =>
                    setGoetheWeekly(e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Goals */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Budget Goals</CardTitle>
            <CardDescription>Financial goals in Euros (€)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Savings</Label>
              <Input
                type="number"
                value={budgetSavings}
                placeholder="e.g. 20000"
                onChange={(e) =>
                  setBudgetSavings(e.target.value === "" ? "" : parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Target Blocked Account</Label>
              <Input
                type="number"
                value={budgetBlocked}
                placeholder="e.g. 11208"
                onChange={(e) =>
                  setBudgetBlocked(e.target.value === "" ? "" : parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Monthly Budget</Label>
              <Input
                type="number"
                value={budgetMonthly}
                placeholder="e.g. 934"
                onChange={(e) =>
                  setBudgetMonthly(e.target.value === "" ? "" : parseInt(e.target.value))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* University Goals */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>University Goals</CardTitle>
            <CardDescription>Your admissions expectations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dream University</Label>
              <Input
                type="text"
                value={uniDream}
                onChange={(e) => setUniDream(e.target.value)}
                placeholder="e.g. TUM"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Intake</Label>
                <Select value={uniIntakeSeason} onValueChange={setUniIntakeSeason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Summer">Summer</SelectItem>
                    <SelectItem value="Winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="text"
                  value={uniIntakeYear}
                  onChange={(e) => setUniIntakeYear(e.target.value)}
                  placeholder="e.g. 2027"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>App. Count</Label>
                <Input
                  type="number"
                  value={uniAppCount}
                  placeholder="e.g. 8"
                  onChange={(e) =>
                    setUniAppCount(e.target.value === "" ? "" : parseInt(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Acc. Count</Label>
                <Input
                  type="number"
                  value={uniAccCount}
                  placeholder="e.g. 3"
                  onChange={(e) =>
                    setUniAccCount(e.target.value === "" ? "" : parseInt(e.target.value))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Goals */}
        <Card className="shadow-card md:col-span-2">
          <CardHeader>
            <CardTitle>Timeline Goals</CardTitle>
            <CardDescription>Key document and process target dates</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-5">
            <div className="space-y-2">
              <Label>Passport</Label>
              <Input
                type="date"
                value={timelinePassport}
                onChange={(e) => setTimelinePassport(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>APS Certificate</Label>
              <Input
                type="date"
                value={timelineAps}
                onChange={(e) => setTimelineAps(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Visa</Label>
              <Input
                type="date"
                value={timelineVisa}
                onChange={(e) => setTimelineVisa(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Accommodation</Label>
              <Input
                type="date"
                value={timelineAccomm}
                onChange={(e) => setTimelineAccomm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Flight</Label>
              <Input
                type="date"
                value={timelineFlight}
                onChange={(e) => setTimelineFlight(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
}
