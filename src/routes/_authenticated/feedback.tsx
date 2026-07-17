import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback & Suggestions — Abroad Compass" },
      {
        name: "description",
        content: "Have an idea, found a bug, or want to improve Abroad Compass? Send us your feedback.",
      },
    ],
  }),
  component: FeedbackPage,
});

const feedbackSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().trim().min(3, "Subject is too short").max(120),
  message: z.string().trim().min(10, "Please add more detail").max(2000),
});

function FeedbackPage() {
  const { user } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const create = useMutation({
    mutationFn: async (input: z.infer<typeof feedbackSchema>) => {
      const parsed = feedbackSchema.parse(input);
      const { error } = await supabase.from("feedback_items" as never).insert({
        title: parsed.subject,
        description: parsed.message,
        name: parsed.name,
        email: parsed.email,
        kind: "general", // default
        user_id: user!.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback submitted successfully. Thank you!");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({ name, email, subject, message });
  };

  const disabled = 
    name.trim().length < 2 || 
    !email.includes("@") || 
    subject.trim().length < 3 || 
    message.trim().length < 10 || 
    create.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-4">
      <header className="space-y-2 text-center">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">
          Feedback
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Feedback & Suggestions
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md">
          Have an idea, found a bug, or want to improve Abroad Compass?
          Send us your feedback. We read every submission.
        </p>
      </header>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={create.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={create.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="What is this regarding?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                disabled={create.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Please describe your feedback, idea, or issue in detail..."
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                disabled={create.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={disabled}
            >
              {create.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="mr-2 h-4 w-4" />
              )}
              Send Feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
