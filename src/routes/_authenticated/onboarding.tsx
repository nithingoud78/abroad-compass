import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Loader2, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingWizard,
});

type Subject = { name: string; credits: string; grade: string; marks: string };
type Semester = { name: string; subjects: Subject[] };

const steps = ["Basic", "Education", "Semesters", "Achievements", "Projects", "Certificates"];

function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [targetCountry, setTargetCountry] = useState("Germany");
  const [targetIntake, setTargetIntake] = useState("WS-2026");
  const [targetDegree, setTargetDegree] = useState("Master");
  const [germanLevel, setGermanLevel] = useState("A1");

  // Step 2
  const [tenth, setTenth] = useState("");
  const [inter, setInter] = useState("");
  const [ugCgpa, setUgCgpa] = useState("");
  const [curSem, setCurSem] = useState("");
  const [totalCredits, setTotalCredits] = useState("");

  // Step 3
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // Step 4
  const [achievements, setAchievements] = useState<
    { title: string; description: string; date: string }[]
  >([]);

  // Step 5
  const [projects, setProjects] = useState<
    { name: string; github_url: string; demo_url: string; description: string; status: string }[]
  >([]);

  // Step 6
  const [certificates, setCertificates] = useState<
    { cert_type: string; score: string; date: string }[]
  >([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_completed) navigate({ to: "/dashboard" });
        if (data?.display_name) setDisplayName(data.display_name);
        if (data?.username) {
          setUsername(data.username);
          setOriginalUsername(data.username);
        }
      });
  }, [user, navigate]);

  useEffect(() => {
    if (!username || username === originalUsername) {
      setUsernameError("");
      return;
    }

    // validate format
    if (username.length < 3 || username.length > 30) {
      setUsernameError("Must be between 3 and 30 characters");
      return;
    }
    if (!/^[a-z0-9._]+$/.test(username)) {
      setUsernameError("Only lowercase letters, numbers, periods, and underscores allowed");
      return;
    }

    const checkAvailability = async () => {
      setUsernameChecking(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();

      setUsernameChecking(false);
      if (error) {
        setUsernameError("Error checking availability");
      } else if (data && data.user_id !== user?.id) {
        setUsernameError("Username is taken");
      } else {
        setUsernameError("");
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [username, originalUsername, user?.id]);

  async function finish() {
    if (!user) return;
    setSaving(true);
    try {
      // Profile
      await supabase.from("profiles").upsert({
        user_id: user.id,
        display_name: displayName,
        username: username || null,
        target_country: targetCountry,
        target_intake: targetIntake,
        target_degree: targetDegree,
        current_german_level: germanLevel,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });
      // Education
      await supabase.from("education").upsert({
        user_id: user.id,
        tenth_percentage: tenth ? Number(tenth) : null,
        intermediate: inter || null,
        ug_cgpa: ugCgpa ? Number(ugCgpa) : null,
        current_semester: curSem ? Number(curSem) : null,
        total_credits: totalCredits ? Number(totalCredits) : null,
        updated_at: new Date().toISOString(),
      });
      // Semesters
      for (let i = 0; i < semesters.length; i++) {
        const sem = semesters[i];
        const validSubjects = sem.subjects.filter((s) => s.name.trim());
        const { sgpa, ects, credits } = computeSemester(validSubjects);
        const { data: semRow, error: semErr } = await supabase
          .from("semesters")
          .insert({
            user_id: user.id,
            semester_number: i + 1,
            name: sem.name || `Semester ${i + 1}`,
            sgpa,
            ects_estimate: ects,
            credits_completed: credits,
          })
          .select()
          .single();
        if (semErr || !semRow) continue;
        if (validSubjects.length) {
          await supabase.from("semester_subjects").insert(
            validSubjects.map((s) => ({
              user_id: user.id,
              semester_id: semRow.id,
              name: s.name,
              credits: Number(s.credits) || 0,
              grade: s.grade || null,
              marks: s.marks ? Number(s.marks) : null,
            })),
          );
        }
      }
      // Achievements
      const validAch = achievements.filter((a) => a.title.trim());
      if (validAch.length) {
        await supabase.from("achievements").insert(
          validAch.map((a) => ({
            user_id: user.id,
            title: a.title,
            description: a.description || null,
            achieved_on: a.date || null,
          })),
        );
      }
      // Projects
      const validProj = projects.filter((p) => p.name.trim());
      if (validProj.length) {
        await supabase.from("projects").insert(
          validProj.map((p) => ({
            user_id: user.id,
            name: p.name,
            github_url: p.github_url || null,
            demo_url: p.demo_url || null,
            description: p.description || null,
            status: p.status || "in_progress",
          })),
        );
      }
      // Certificates
      const validCert = certificates.filter((c) => c.cert_type.trim());
      if (validCert.length) {
        await supabase.from("certificates").insert(
          validCert.map((c) => ({
            user_id: user.id,
            cert_type: c.cert_type,
            score: c.score || null,
            obtained_on: c.date || null,
          })),
        );
      }
      toast.success("Profile setup complete!");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {steps.length}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">{steps[step]}</h1>
        <Progress value={((step + 1) / steps.length) * 100} className="mt-3 h-1.5" />
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border bg-card p-6 shadow-card sm:p-8"
      >
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Display name">
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))
                }
                className={usernameError ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {usernameChecking && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking...
                </p>
              )}
              {usernameError && !usernameChecking && (
                <p className="text-xs text-red-500">{usernameError}</p>
              )}
              {!usernameError && !usernameChecking && username && username !== originalUsername && (
                <p className="text-xs text-green-500">Username available</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Target country">
                <Select value={targetCountry} onValueChange={setTargetCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Germany", "Canada", "USA", "Australia", "France", "Netherlands"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Target intake">
                <Select value={targetIntake} onValueChange={setTargetIntake}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["WS-2025", "SS-2026", "WS-2026", "SS-2027", "WS-2027"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Target degree">
                <Select value={targetDegree} onValueChange={setTargetDegree}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Bachelor", "Master", "PhD"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Current German level">
                <Select value={germanLevel} onValueChange={setGermanLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["None", "A1", "A2", "B1", "B2", "C1", "C2"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="10th percentage">
              <Input type="number" value={tenth} onChange={(e) => setTenth(e.target.value)} />
            </Field>
            <Field label="Intermediate / Diploma">
              <Input value={inter} onChange={(e) => setInter(e.target.value)} />
            </Field>
            <Field label="UG CGPA">
              <Input
                type="number"
                step="0.01"
                value={ugCgpa}
                onChange={(e) => setUgCgpa(e.target.value)}
              />
            </Field>
            <Field label="Current semester">
              <Input type="number" value={curSem} onChange={(e) => setCurSem(e.target.value)} />
            </Field>
            <Field label="Total credits">
              <Input
                type="number"
                value={totalCredits}
                onChange={(e) => setTotalCredits(e.target.value)}
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {semesters.map((sem, si) => (
              <div key={si} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Input
                    className="max-w-xs"
                    placeholder={`Semester ${si + 1}`}
                    value={sem.name}
                    onChange={(e) =>
                      setSemesters((prev) =>
                        prev.map((s, i) => (i === si ? { ...s, name: e.target.value } : s)),
                      )
                    }
                  />
                  <button onClick={() => setSemesters((p) => p.filter((_, i) => i !== si))}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-2">
                  {sem.subjects.map((sub, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <Input
                        className="col-span-5"
                        placeholder="Subject"
                        value={sub.name}
                        onChange={(e) =>
                          updateSubject(setSemesters, si, idx, { name: e.target.value })
                        }
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        placeholder="Credits"
                        value={sub.credits}
                        onChange={(e) =>
                          updateSubject(setSemesters, si, idx, { credits: e.target.value })
                        }
                      />
                      <Input
                        className="col-span-2"
                        placeholder="Grade"
                        value={sub.grade}
                        onChange={(e) =>
                          updateSubject(setSemesters, si, idx, { grade: e.target.value })
                        }
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        placeholder="Marks"
                        value={sub.marks}
                        onChange={(e) =>
                          updateSubject(setSemesters, si, idx, { marks: e.target.value })
                        }
                      />
                      <button
                        className="col-span-1"
                        onClick={() =>
                          setSemesters((prev) =>
                            prev.map((s, i) =>
                              i === si
                                ? { ...s, subjects: s.subjects.filter((_, k) => k !== idx) }
                                : s,
                            ),
                          )
                        }
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSemesters((prev) =>
                        prev.map((s, i) =>
                          i === si
                            ? {
                                ...s,
                                subjects: [
                                  ...s.subjects,
                                  { name: "", credits: "", grade: "", marks: "" },
                                ],
                              }
                            : s,
                        ),
                      )
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add subject
                  </Button>
                </div>
                <SemesterSummary subjects={sem.subjects} />
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => setSemesters((p) => [...p, { name: "", subjects: [] }])}
            >
              <Plus className="mr-2 h-4 w-4" /> Add semester
            </Button>
          </div>
        )}

        {step === 3 && (
          <RepeaterList
            items={achievements}
            setItems={setAchievements}
            blank={{ title: "", description: "", date: "" }}
            render={(a, i, upd) => (
              <>
                <Input
                  placeholder="Title"
                  value={a.title}
                  onChange={(e) => upd(i, { title: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  rows={2}
                  value={a.description}
                  onChange={(e) => upd(i, { description: e.target.value })}
                />
                <Input
                  type="date"
                  value={a.date}
                  onChange={(e) => upd(i, { date: e.target.value })}
                />
              </>
            )}
            addLabel="Add achievement"
          />
        )}

        {step === 4 && (
          <RepeaterList
            items={projects}
            setItems={setProjects}
            blank={{
              name: "",
              github_url: "",
              demo_url: "",
              description: "",
              status: "in_progress",
            }}
            render={(p, i, upd) => (
              <>
                <Input
                  placeholder="Project name"
                  value={p.name}
                  onChange={(e) => upd(i, { name: e.target.value })}
                />
                <Input
                  placeholder="GitHub URL"
                  value={p.github_url}
                  onChange={(e) => upd(i, { github_url: e.target.value })}
                />
                <Input
                  placeholder="Demo URL"
                  value={p.demo_url}
                  onChange={(e) => upd(i, { demo_url: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  rows={2}
                  value={p.description}
                  onChange={(e) => upd(i, { description: e.target.value })}
                />
                <Select value={p.status} onValueChange={(v) => upd(i, { status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            addLabel="Add project"
          />
        )}

        {step === 5 && (
          <RepeaterList
            items={certificates}
            setItems={setCertificates}
            blank={{ cert_type: "IELTS", score: "", date: "" }}
            render={(c, i, upd) => (
              <>
                <Select value={c.cert_type} onValueChange={(v) => upd(i, { cert_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["IELTS", "TOEFL", "Goethe", "TestDaF", "APS", "GRE", "GMAT", "Other"].map(
                      (t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Score"
                  value={c.score}
                  onChange={(e) => upd(i, { score: e.target.value })}
                />
                <Input
                  type="date"
                  value={c.date}
                  onChange={(e) => upd(i, { date: e.target.value })}
                />
              </>
            )}
            addLabel="Add certificate"
          />
        )}

        <div className="mt-8 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!!usernameError || usernameChecking}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Go to dashboard
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function updateSubject(
  setter: React.Dispatch<React.SetStateAction<Semester[]>>,
  si: number,
  idx: number,
  patch: Partial<Subject>,
) {
  setter((prev) =>
    prev.map((s, i) =>
      i === si
        ? { ...s, subjects: s.subjects.map((sub, k) => (k === idx ? { ...sub, ...patch } : sub)) }
        : s,
    ),
  );
}

function computeSemester(subjects: Subject[]) {
  const credits = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
  const weighted = subjects.reduce((sum, s) => {
    const cr = Number(s.credits) || 0;
    const gp = gradeToPoints(s.grade);
    return sum + cr * gp;
  }, 0);
  const sgpa = credits ? Number((weighted / credits).toFixed(2)) : null;
  const ects = Number((credits * 1.5).toFixed(1));
  return { sgpa, ects, credits };
}

function gradeToPoints(grade: string) {
  const map: Record<string, number> = { O: 10, "A+": 9.5, A: 9, "B+": 8, B: 7, C: 6, D: 5, F: 0 };
  return map[grade?.toUpperCase()] ?? 0;
}

function SemesterSummary({ subjects }: { subjects: Subject[] }) {
  const { sgpa, ects, credits } = computeSemester(subjects);
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span>
        SGPA: <strong className="text-foreground">{sgpa ?? "—"}</strong>
      </span>
      <span>
        Credits: <strong className="text-foreground">{credits}</strong>
      </span>
      <span>
        ECTS est.: <strong className="text-foreground">{ects}</strong>
      </span>
    </div>
  );
}

function RepeaterList<T>({
  items,
  setItems,
  blank,
  render,
  addLabel,
}: {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  blank: T;
  render: (item: T, i: number, upd: (i: number, patch: Partial<T>) => void) => React.ReactNode;
  addLabel: string;
}) {
  const upd = (i: number, patch: Partial<T>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-xl border p-4">
          <div className="flex justify-end">
            <button onClick={() => setItems((p) => p.filter((_, k) => k !== i))}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          {render(it, i, upd)}
        </div>
      ))}
      <Button variant="outline" onClick={() => setItems((p) => [...p, { ...blank }])}>
        <Plus className="mr-2 h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
