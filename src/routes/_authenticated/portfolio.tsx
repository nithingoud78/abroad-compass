import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Trash2,
  Loader2,
  Github,
  ExternalLink,
  Award,
  GraduationCap,
  Trophy,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getPortfolioAnalysis } from "@/lib/ai/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/app/EmptyState";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Abroad Compass" }] }),
  component: PortfolioPage,
});

type Project = {
  id: string;
  name: string;
  description: string | null;
  github_url: string | null;
  demo_url: string | null;
  status: string | null;
};
type Certificate = {
  id: string;
  cert_type: string;
  name: string | null;
  score: string | null;
  obtained_on: string | null;
  file_url: string | null;
};
type Achievement = {
  id: string;
  title: string;
  description: string | null;
  achieved_on: string | null;
};

function PortfolioPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  // shared dialog state per type
  const [openProject, setOpenProject] = useState(false);
  const [openCert, setOpenCert] = useState(false);
  const [openAch, setOpenAch] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pForm, setPForm] = useState({
    name: "",
    description: "",
    github_url: "",
    demo_url: "",
    status: "completed",
  });
  const [cForm, setCForm] = useState({
    cert_type: "IELTS",
    name: "",
    score: "",
    obtained_on: "",
    file_url: "",
  });
  const [aForm, setAForm] = useState({ title: "", description: "", achieved_on: "" });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const analyzeFn = useServerFn(getPortfolioAnalysis);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [p, c, a] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("certificates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setProjects((p.data ?? []) as Project[]);
    setCerts((c.data ?? []) as Certificate[]);
    setAchievements((a.data ?? []) as Achievement[]);
    setLoading(false);
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [user]);

  const strength = useMemo(() => {
    let score = 0;
    score += Math.min(35, projects.length * 9);
    score += Math.min(35, certs.length * 9);
    score += Math.min(20, achievements.length * 5);
    if (projects.some((p) => p.github_url || p.demo_url)) score += 10;
    return Math.min(100, score);
  }, [projects, certs, achievements]);

  async function saveProject() {
    if (!user || !pForm.name.trim()) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      name: pForm.name.trim(),
      description: pForm.description || null,
      github_url: pForm.github_url || null,
      demo_url: pForm.demo_url || null,
      status: pForm.status,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOpenProject(false);
    setPForm({ name: "", description: "", github_url: "", demo_url: "", status: "completed" });
    load();
  }
  async function saveCert() {
    if (!user || !cForm.cert_type.trim()) {
      toast.error("Type required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("certificates").insert({
      user_id: user.id,
      cert_type: cForm.cert_type,
      name: cForm.name || null,
      score: cForm.score || null,
      obtained_on: cForm.obtained_on || null,
      file_url: cForm.file_url || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOpenCert(false);
    setCForm({ cert_type: "IELTS", name: "", score: "", obtained_on: "", file_url: "" });
    load();
  }
  async function saveAch() {
    if (!user || !aForm.title.trim()) {
      toast.error("Title required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("achievements").insert({
      user_id: user.id,
      title: aForm.title.trim(),
      description: aForm.description || null,
      achieved_on: aForm.achieved_on || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOpenAch(false);
    setAForm({ title: "", description: "", achieved_on: "" });
    load();
  }

  const remove = async (table: "projects" | "certificates" | "achievements", id: string) => {
    await supabase.from(table).delete().eq("id", id);
    load();
  };

  const totalItems = projects.length + certs.length + achievements.length;
  const progressPercent = totalItems >= 5 ? 100 : (totalItems / 5) * 100;

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await analyzeFn({ data: { projects, certs, achievements } });
      setAiAnalysis(res.analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Portfolio</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Build a stand-out profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize projects, certificates, and achievements.
          </p>
        </div>
      </header>

      <div className="flex justify-end">
        <Button
          variant="secondary"
          className="gap-2 bg-brand/10 text-brand hover:bg-brand/20"
          onClick={handleAnalyze}
          disabled={analyzing || aiAnalysis !== null}
        >
          {analyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {aiAnalysis ? "AI Readiness Evaluated" : "Evaluate Profile Readiness"}
        </Button>
      </div>

      {aiAnalysis && (
        <div className="rounded-xl border bg-brand/5 p-5 text-sm text-foreground">
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-brand">
            <Sparkles className="h-5 w-5" /> AI Admission Committee Feedback
          </div>
          <p className="leading-relaxed">{aiAnalysis}</p>
        </div>
      )}

      <Card className="shadow-card">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Profile strength</p>
              <p className="font-display text-2xl font-bold">{strength}%</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{projects.length} projects</Badge>
              <Badge variant="secondary">{certs.length} certificates</Badge>
              <Badge variant="secondary">{achievements.length} achievements</Badge>
            </div>
          </div>
          <Progress value={strength} />
          <p className="text-xs text-muted-foreground">
            Add projects with GitHub or live demos, language certificates (IELTS / TestDaF /
            Goethe), and hackathon or scholarship wins to strengthen your application.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">
            <FolderKanban className="mr-1.5 h-3.5 w-3.5" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="certificates">
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="mr-1.5 h-3.5 w-3.5" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-3 pt-3">
          <div className="flex justify-end">
            <Dialog open={openProject} onOpenChange={setOpenProject}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add project</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Field label="Name">
                    <Input
                      value={pForm.name}
                      onChange={(e) => setPForm({ ...pForm, name: e.target.value })}
                    />
                  </Field>
                  <Field label="Description">
                    <Textarea
                      rows={3}
                      value={pForm.description}
                      onChange={(e) => setPForm({ ...pForm, description: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="GitHub URL">
                      <Input
                        value={pForm.github_url}
                        onChange={(e) => setPForm({ ...pForm, github_url: e.target.value })}
                        placeholder="https://github.com/…"
                      />
                    </Field>
                    <Field label="Live demo URL">
                      <Input
                        value={pForm.demo_url}
                        onChange={(e) => setPForm({ ...pForm, demo_url: e.target.value })}
                        placeholder="https://…"
                      />
                    </Field>
                  </div>
                  <Field label="Status">
                    <Select
                      value={pForm.status}
                      onValueChange={(v) => setPForm({ ...pForm, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["planning", "in_progress", "completed", "shipped"].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" onClick={() => setOpenProject(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveProject} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Add your first project — bonus points for links."
              action={{ label: "Add project", onClick: () => setOpenProject(true) }}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {projects.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="shadow-card">
                    <CardContent className="space-y-2 p-5">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="font-display text-lg font-semibold">{p.name}</p>
                          {p.status && (
                            <Badge variant="secondary" className="mt-1 text-[10px]">
                              {p.status}
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={() => remove("projects", p.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {p.description && (
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        {p.github_url && (
                          <a
                            href={p.github_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Github className="h-3.5 w-3.5" />
                            Code
                          </a>
                        )}
                        {p.demo_url && (
                          <a
                            href={p.demo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Demo
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-3 pt-3">
          <div className="flex justify-end">
            <Dialog open={openCert} onOpenChange={setOpenCert}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add certificate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add certificate</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Type">
                      <Select
                        value={cForm.cert_type}
                        onValueChange={(v) => setCForm({ ...cForm, cert_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "IELTS",
                            "TOEFL",
                            "Duolingo",
                            "Goethe",
                            "TestDaF",
                            "telc",
                            "APS",
                            "GRE",
                            "GMAT",
                            "Other",
                          ].map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Score / Level">
                      <Input
                        value={cForm.score}
                        onChange={(e) => setCForm({ ...cForm, score: e.target.value })}
                        placeholder="e.g. 7.5 or B2"
                      />
                    </Field>
                  </div>
                  <Field label="Name">
                    <Input
                      value={cForm.name}
                      onChange={(e) => setCForm({ ...cForm, name: e.target.value })}
                      placeholder="optional"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Obtained on">
                      <Input
                        type="date"
                        value={cForm.obtained_on}
                        onChange={(e) => setCForm({ ...cForm, obtained_on: e.target.value })}
                      />
                    </Field>
                    <Field label="File URL">
                      <Input
                        value={cForm.file_url}
                        onChange={(e) => setCForm({ ...cForm, file_url: e.target.value })}
                        placeholder="https://…"
                      />
                    </Field>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" onClick={() => setOpenCert(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveCert} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : certs.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No certificates"
              description="Language tests, APS, GRE — add what you have."
              action={{ label: "Add certificate", onClick: () => setOpenCert(true) }}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {certs.map((c) => (
                <Card key={c.id} className="shadow-card">
                  <CardContent className="flex items-start justify-between gap-3 p-5">
                    <div>
                      <p className="font-display text-base font-semibold">
                        {c.cert_type}
                        {c.score && (
                          <span className="ml-2 text-sm text-muted-foreground">{c.score}</span>
                        )}
                      </p>
                      {c.name && <p className="text-sm text-muted-foreground">{c.name}</p>}
                      {c.obtained_on && (
                        <p className="text-xs text-muted-foreground pt-1">
                          {new Date(c.obtained_on).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.file_url && (
                        <a
                          href={c.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Open file"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => remove("certificates", c.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-3 pt-3">
          <div className="flex justify-end">
            <Dialog open={openAch} onOpenChange={setOpenAch}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add achievement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add achievement</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Field label="Title">
                    <Input
                      value={aForm.title}
                      onChange={(e) => setAForm({ ...aForm, title: e.target.value })}
                    />
                  </Field>
                  <Field label="Description">
                    <Textarea
                      rows={3}
                      value={aForm.description}
                      onChange={(e) => setAForm({ ...aForm, description: e.target.value })}
                    />
                  </Field>
                  <Field label="Date">
                    <Input
                      type="date"
                      value={aForm.achieved_on}
                      onChange={(e) => setAForm({ ...aForm, achieved_on: e.target.value })}
                    />
                  </Field>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" onClick={() => setOpenAch(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveAch} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : achievements.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No achievements yet"
              description="Hackathon wins, scholarships, leadership roles — add them here."
              action={{ label: "Add achievement", onClick: () => setOpenAch(true) }}
            />
          ) : (
            <div className="space-y-2">
              {achievements.map((a) => (
                <Card key={a.id} className="shadow-card">
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      {a.description && (
                        <p className="text-sm text-muted-foreground">{a.description}</p>
                      )}
                      {a.achieved_on && (
                        <p className="text-xs text-muted-foreground pt-1">
                          {new Date(a.achieved_on).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => remove("achievements", a.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
