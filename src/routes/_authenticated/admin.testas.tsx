/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/testas")({
  component: AdminTestAS,
});

function AdminTestAS() {
  const [testasSched, setTestasSched] = useState<any>({
    registration_opens: "",
    registration_closes: "",
    exam_date: "",
    result_date: "",
    exam_fee: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    setLoading(true);
    const { data, error } = await (supabase.from as any)("admin_exam_schedule")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      toast.error(`Error loading schedule: ${error.message}`);
    } else if (data) {
      setTestasSched(data);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await (supabase.from as any)("admin_exam_schedule").upsert({
      id: testasSched.id || undefined,
      is_active: true,
      registration_opens: testasSched.registration_opens || null,
      registration_closes: testasSched.registration_closes || null,
      exam_date: testasSched.exam_date || null,
      result_date: testasSched.result_date || null,
      exam_fee: testasSched.exam_fee || 0,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (error) {
      console.error(error);
      toast.error(`Failed to save TestAS schedule: ${error.message}`);
    } else {
      toast.success("TestAS schedule saved successfully");
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">TestAS Administration</h2>
        <p className="text-muted-foreground">Manage the official TestAS exam schedule and fees.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule & Fees</CardTitle>
          <CardDescription>
            These values will be shown on the Dashboard countdown and public TestAS page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Opens</label>
              <Input
                type="date"
                value={testasSched.registration_opens?.split("T")[0] || ""}
                onChange={(e) =>
                  setTestasSched({ ...testasSched, registration_opens: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Deadline</label>
              <Input
                type="date"
                value={testasSched.registration_closes?.split("T")[0] || ""}
                onChange={(e) =>
                  setTestasSched({ ...testasSched, registration_closes: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Exam Date</label>
              <Input
                type="date"
                value={testasSched.exam_date?.split("T")[0] || ""}
                onChange={(e) => setTestasSched({ ...testasSched, exam_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Result Date</label>
              <Input
                type="date"
                value={testasSched.result_date?.split("T")[0] || ""}
                onChange={(e) => setTestasSched({ ...testasSched, result_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Exam Fee (€)</label>
              <Input
                type="number"
                value={testasSched.exam_fee || 0}
                onChange={(e) =>
                  setTestasSched({ ...testasSched, exam_fee: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Schedule
        </Button>
      </div>
    </div>
  );
}
