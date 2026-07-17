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
  instagram_username?: string | null;
  github_username?: string | null;
  linkedin_username?: string | null;
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
        initiator_id,
        profile_1:profiles!study_buddies_user_id_1_fkey(username, display_name, avatar_url, instagram_username, github_username, linkedin_username),
        profile_2:profiles!study_buddies_user_id_2_fkey(username, display_name, avatar_url, instagram_username, github_username, linkedin_username)
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
          isInitiator: d.initiator_id ? d.initiator_id === user.id : d.user_id_1 === user.id,
          instagram_username: otherProfile?.instagram_username,
          github_username: otherProfile?.github_username,
          linkedin_username: otherProfile?.linkedin_username,
        };
      });
      setBuddies(mapped);
    }
    setLoading(false);
  }

  async function sendRequest(targetUserId: string) {
    if (!user) return false;
    const isUser1 = user.id < targetUserId;
    const { error } = await supabase.from("study_buddies").insert({
      user_id_1: isUser1 ? user.id : targetUserId,
      user_id_2: isUser1 ? targetUserId : user.id,
      initiator_id: user.id,
      status: "pending",
    });

    if (error) {
      toast.error("Could not send request");
      return false;
    }

    await supabase.from("notifications").insert({
      receiver_id: targetUserId,
      sender_id: user.id,
      profile_id: user.id,
      type: "buddy_request",
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
      await supabase.from("notifications").insert({
        receiver_id: buddy.user_id,
        sender_id: user.id,
        profile_id: user.id,
        type: "buddy_accepted",
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
