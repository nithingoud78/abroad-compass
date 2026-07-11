// Habits + habit completions with realtime + optimistic streak recomputation.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format, subDays, differenceInDays } from "date-fns";
import { toast } from "sonner";

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  cadence: string;
  target_per_period: number;
  category: string | null;
  current_streak: number;
  longest_streak: number;
  last_completed_on: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HabitCompletion = {
  id: string;
  habit_id: string;
  completed_on: string;
  count: number;
  note: string | null;
};

export function useHabits() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const habitsQ = useQuery({
    queryKey: ["habits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits" as never)
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Habit[];
    },
  });

  const completionsQ = useQuery({
    queryKey: ["habit-completions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = format(subDays(new Date(), 60), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("habit_completions" as never)
        .select("*")
        .gte("completed_on", since)
        .order("completed_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as HabitCompletion[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: Partial<Habit>) => {
      const { error } = await supabase
        .from("habits" as never)
        .insert({ ...input, user_id: user!.id } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits", user?.id] });
      toast.success("Habit created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("habits" as never)
        .update({ archived_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits", user?.id] }),
  });

  const complete = useMutation({
    mutationFn: async (habit: Habit) => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { error } = await supabase
        .from("habit_completions" as never)
        .upsert({ habit_id: habit.id, user_id: user!.id, completed_on: today, count: 1 } as never, {
          onConflict: "habit_id,completed_on",
        });
      if (error) throw error;

      // Streak recompute (client-side; deterministic + fast).
      const last = habit.last_completed_on;
      let newStreak = 1;
      if (last === today) newStreak = habit.current_streak;
      else if (last && differenceInDays(new Date(today), new Date(last)) === 1)
        newStreak = habit.current_streak + 1;
      const longest = Math.max(newStreak, habit.longest_streak);
      const { error: uerr } = await supabase
        .from("habits" as never)
        .update({
          current_streak: newStreak,
          longest_streak: longest,
          last_completed_on: today,
        } as never)
        .eq("id", habit.id);
      if (uerr) throw uerr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits", user?.id] });
      qc.invalidateQueries({ queryKey: ["habit-completions", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    habits: habitsQ.data ?? [],
    completions: completionsQ.data ?? [],
    loading: habitsQ.isLoading,
    create,
    archive,
    complete,
  };
}
