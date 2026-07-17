import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStudyBuddies } from "@/hooks/use-study-buddies";
import { StandardPageLayout } from "@/components/app/StandardPageLayout";
import { toast } from "sonner";
import {
  Users,
  Search,
  Loader2,
  ArrowRight,
  UserPlus,
  HeartHandshake,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/friends")({
  component: Friends,
});

type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  current_german_level: string | null;
  target_country: string | null;
  avatar_url?: string;
};

function Friends() {
  const { user } = useAuth();
  const {
    buddies,
    loading: buddiesLoading,
    sendRequest,
    acceptRequest,
    removeBuddy,
  } = useStudyBuddies();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      searchUsers(debouncedQuery.trim());
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  }, [debouncedQuery]);

  async function searchUsers(query: string) {
    setSearching(true);
    let req = supabase
      .from("profiles")
      .select("user_id, username, display_name, current_german_level, target_country, avatar_url")
      .ilike("username", `%${query}%`)
      .neq("user_id", user?.id ?? "")
      .limit(20);

    const buddyIds = buddies.map((b) => b.user_id);
    if (buddyIds.length > 0) {
      req = req.not("user_id", "in", `(${buddyIds.join(",")})`);
    }

    const { data, error } = await req;

    setSearching(false);
    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSearchResults(data as any);
    }
  }

  const pendingRequests = buddies.filter((b) => b.status === "pending" && !b.isInitiator);
  const sentRequests = buddies.filter((b) => b.status === "pending" && b.isInitiator);
  const activeBuddies = buddies.filter((b) => b.status === "accepted");

  function BuddyActionButtons({ targetUserId }: { targetUserId: string }) {
    const buddyRelation = buddies.find((b) => b.user_id === targetUserId);

    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/profile/$username"
            params={{
              username: searchResults.find((s) => s.user_id === targetUserId)?.username || "",
            }}
          >
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </Button>
        {buddyRelation ? (
          buddyRelation.status === "accepted" ? (
            <Button variant="secondary" size="sm" onClick={() => removeBuddy(buddyRelation.id)}>
              <UserCheck className="h-4 w-4 mr-1" /> Buddy
            </Button>
          ) : buddyRelation.isInitiator ? (
            <Button variant="secondary" size="sm" disabled>
              Pending
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              onClick={() => acceptRequest(buddyRelation.id)}
            >
              Accept
            </Button>
          )
        ) : (
          <Button variant="outline" size="sm" onClick={() => sendRequest(targetUserId)}>
            <HeartHandshake className="h-4 w-4 mr-1" /> Add Buddy
          </Button>
        )}
      </div>
    );
  }

  return (
    <StandardPageLayout title="Friends & Connections" subtitle="Community">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Column: Search */}
        <div className="space-y-6">
          <Card className="shadow-card border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-brand" />
                Find Friends
              </CardTitle>
              <CardDescription>Search by username to find users.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search usernames (type at least 3 chars)..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {debouncedQuery.trim().length > 2 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                    Results
                  </h3>
                  {searchResults.length === 0 && !searching && (
                    <p className="text-sm text-muted-foreground">No users found.</p>
                  )}
                  <div className="space-y-3">
                    {searchResults.map((u) => (
                      <div
                        key={u.user_id}
                        className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {u.display_name?.substring(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              to="/profile/$username"
                              params={{ username: u.username as string }}
                              className="font-medium hover:underline flex items-center gap-1"
                            >
                              {u.display_name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              @{u.username} • {u.current_german_level || "A1"}
                            </p>
                          </div>
                        </div>
                        <BuddyActionButtons targetUserId={u.user_id} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: My Buddies */}
        <div className="space-y-6">
          <Card className="shadow-card border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartHandshake className="h-5 w-5 text-brand" />
                Study Buddies
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[10px]">
                    {pendingRequests.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>People you have connected with.</CardDescription>
            </CardHeader>
            <CardContent>
              {buddiesLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Incoming Requests */}
                  {pendingRequests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <UserPlus className="h-4 w-4" /> Incoming Requests
                      </h4>
                      <div className="space-y-3">
                        {pendingRequests.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between p-3 rounded-xl border bg-brand/5 border-brand/20"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {b.display_name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{b.display_name}</p>
                                <p className="text-xs text-muted-foreground">@{b.username}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => removeBuddy(b.id)}>
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                className="bg-brand text-brand-foreground hover:bg-brand/90"
                                onClick={() => acceptRequest(b.id)}
                              >
                                Accept
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Buddies List */}
                  <div>
                    {pendingRequests.length > 0 && (
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                        My Buddies
                      </h4>
                    )}
                    {activeBuddies.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-xl border border-dashed">
                        <HeartHandshake className="h-8 w-8 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium text-foreground">
                          You don't have any Study Buddies yet.
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Search for users to connect.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeBuddies.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between p-3 rounded-xl border bg-card"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {b.display_name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{b.display_name}</p>
                                <p className="text-xs text-muted-foreground">@{b.username}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => removeBuddy(b.id)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StandardPageLayout>
  );
}
