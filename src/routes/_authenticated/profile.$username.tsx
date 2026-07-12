import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  ArrowLeft,
  Trophy,
  MapPin,
  GraduationCap,
  Flame,
  Calendar,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/profile/$username")({
  component: ProfilePage,
});

type ProfileData = {
  user_id: string;
  username: string;
  display_name: string;
  current_german_level?: string;
  target_country?: string;
  target_degree?: string;
  target_intake?: string;
  germany_target_date?: string;
};

type BuddyCount = {
  buddies: number;
};

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [counts, setCounts] = useState<BuddyCount>({ buddies: 0 });

  useEffect(() => {
    loadProfile();
  }, [username, user]);

  async function loadProfile() {
    setLoading(true);
    setError(null);

    // Fetch profile
    const { data: pData, error: pError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (pError || !pData) {
      setError("User not found or does not exist.");
      setLoading(false);
      return;
    }

    setProfile(pData as ProfileData);

    // Fetch buddy counts using study_buddies
    const { count: buddiesCount } = await supabase
      .from("study_buddies")
      .select("*", { count: "exact", head: true })
      .or(`user_id_1.eq.${pData.user_id},user_id_2.eq.${pData.user_id}`)
      .eq("status", "accepted");

    setCounts({
      buddies: buddiesCount || 0,
    });

    // Check if I have a buddy connection with this user
    if (user && user.id !== pData.user_id) {
      const { data: fData } = await supabase
        .from("study_buddies")
        .select("id")
        .or(
          `and(user_id_1.eq.${user.id},user_id_2.eq.${pData.user_id}),and(user_id_1.eq.${pData.user_id},user_id_2.eq.${user.id})`,
        )
        .eq("status", "accepted")
        .maybeSingle();

      setIsFollowing(!!fData);
    }

    setLoading(false);
  }

  async function toggleFollow() {
    if (!user || !profile) return;

    if (isFollowing) {
      const { error } = await supabase
        .from("study_buddies")
        .delete()
        .or(
          `and(user_id_1.eq.${user.id},user_id_2.eq.${profile.user_id}),and(user_id_1.eq.${profile.user_id},user_id_2.eq.${user.id})`,
        );

      if (!error) {
        setIsFollowing(false);
        setCounts((c) => ({ ...c, buddies: Math.max(0, c.buddies - 1) }));
        toast.success(`Disconnected from @${profile.username}`);
      }
    } else {
      const { error } = await supabase
        .from("study_buddies")
        .insert({ user_id_1: user.id, user_id_2: profile.user_id, status: "accepted" });

      if (!error) {
        setIsFollowing(true);
        setCounts((c) => ({ ...c, buddies: c.buddies + 1 }));
        toast.success(`Connected with @${profile.username}`);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-muted-foreground">{error}</p>
        <Button asChild variant="outline">
          <Link to="/friends">Back to Community</Link>
        </Button>
      </div>
    );
  }

  const isMe = user?.id === profile.user_id;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <header className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="-ml-2">
          <Link to="/friends">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Public Profile</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">@{profile.username}</h1>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="shadow-card border md:col-span-1 h-fit">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarFallback className="text-2xl font-display font-bold">
                {profile.display_name?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-display text-xl font-bold">{profile.display_name}</h2>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>

            <div className="flex gap-6 w-full justify-center pt-2 pb-2 border-y border-border/50">
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="font-display font-bold text-lg">{counts.buddies}</p>
                  <p className="text-sm text-muted-foreground">Buddies</p>
                </div>
              </div>
            </div>

            {!isMe && (
              <Button
                className="w-full"
                variant={isFollowing ? "outline" : "default"}
                onClick={toggleFollow}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-card border">
            <CardHeader>
              <CardTitle className="text-lg">Study Goals</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Country</p>
                  <p className="font-medium">{profile.target_country || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-orange-500/10 text-orange-500">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">German Level</p>
                  <p className="font-medium">{profile.current_german_level || "A1"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/10 text-purple-500">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Degree</p>
                  <p className="font-medium">{profile.target_degree || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10 text-green-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Intake</p>
                  <p className="font-medium">{profile.target_intake || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border bg-accent/30 border-dashed">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-2 pb-8">
              <Trophy className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <h3 className="font-medium text-foreground">More details coming soon</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Soon you will be able to see this user's current streaks, recent achievements, and
                target universities.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
