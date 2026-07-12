/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type StudyBuddy = {
  id: string; // buddy relation id
  user_id: string; // the other user's id
  username: string;
  display_name: string;
  status: "pending" | "accepted";
  avatar_url?: string;
  isInitiator?: boolean;
};

export function useStudyBuddies() {
  const { user } = useAuth();
  const [buddies, setBuddies] = useState<StudyBuddy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadBuddies();
  }, [user]);

  async function loadBuddies() {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("study_buddies")
      .select(
        `
        id,
        user_id_1,
        user_id_2,
        status,
        profile_1:profiles!study_buddies_user_id_1_fkey(username, display_name, avatar_url),
        profile_2:profiles!study_buddies_user_id_2_fkey(username, display_name, avatar_url)
      `,
      )
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

    if (error) {
      if (error.code !== "PGRST116") {
        toast.error("Failed to load buddies");
      }
      console.error(error);
      setBuddies([]);
    } else if (data) {
      const mapped: StudyBuddy[] = data.map((d: any) => {
        const isUser1 = d.user_id_1 === user.id;
        const otherUserId = isUser1 ? d.user_id_2 : d.user_id_1;
        const otherProfile = isUser1 ? d.profile_2 : d.profile_1;

        return {
          id: d.id,
          user_id: otherUserId,
          username: otherProfile?.username || "Unknown",
          display_name: otherProfile?.display_name || "Unknown",
          status: d.status,
          avatar_url: otherProfile?.avatar_url,
          isInitiator: d.user_id_1 === user.id,
        };
      });
      setBuddies(mapped);
    }
    setLoading(false);
  }

  async function sendRequest(targetUserId: string) {
    if (!user) return false;
    const { error } = await supabase.from("study_buddies").insert({
      user_id_1: user.id,
      user_id_2: targetUserId,
      status: "pending",
    });

    if (error) {
      toast.error("Could not send request");
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      type: "buddy_request",
      title: "New Study Buddy Request",
      body: `${profile?.display_name || "Someone"} sent you a Study Buddy request.`,
      link: "/friends",
    });

    toast.success("Buddy request sent!");
    loadBuddies();
    return true;
  }

  async function acceptRequest(id: string) {
    if (!user) return false;
    const { error } = await supabase
      .from("study_buddies")
      .update({ status: "accepted" })
      .eq("id", id);

    if (error) {
      toast.error("Could not accept request");
      return false;
    }

    // We need to know who sent it to notify them
    const buddy = buddies.find((b) => b.id === id);
    if (buddy) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      await supabase.from("notifications").insert({
        user_id: buddy.user_id,
        type: "buddy_accepted",
        title: "Request Accepted",
        body: `${profile?.display_name || "Someone"} accepted your Study Buddy request.`,
        link: "/profile/" + user.id,
      });
    }

    toast.success("Buddy request accepted!");
    loadBuddies();
    return true;
  }

  async function removeBuddy(id: string) {
    if (!user) return false;
    const { error } = await supabase.from("study_buddies").delete().eq("id", id);
    if (error) {
      toast.error("Could not remove buddy");
      return false;
    }
    toast.success("Buddy removed");
    loadBuddies();
    return true;
  }

  return { buddies, loading, loadBuddies, sendRequest, acceptRequest, removeBuddy };
}
