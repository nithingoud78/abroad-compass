import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, generateObject } from "ai";
import { createAiProvider } from "./provider.server";

export const updateAiUserSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (i: { provider?: string; model?: string; custom_api_key?: string; base_url?: string }) => i,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any)
      .from("ai_user_settings")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const testAiConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ai = await createAiProvider(context.userId);
    if (!ai) {
      return { success: false, message: "AI provider is not configured properly." };
    }
    try {
      await generateText({
        model: ai(),
        system: "You are a helpful assistant.",
        prompt: "Say 'OK' if you can read this.",
      });
      return { success: true, message: "Connection successful!" };
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: err.message || "Failed to connect to AI provider." };
    }
  });

export const getUniversityRecommendation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z
      .object({
        universityName: z.string(),
        course: z.string(),
        cgpa: z.string().optional(),
        userProfile: z.any().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const ai = await createAiProvider(context.userId);
    if (!ai)
      return { recommendation: "AI is not configured. Please check your settings.", confidence: 0 };

    try {
      console.log(`[AI Execution] Starting getUniversityRecommendation...`);
      const { text } = await generateText({
        model: ai(),
        system:
          "You are an expert study-abroad consultant for Germany. Provide a short, structured evaluation (3 sentences max) of the candidate's chances at this university. Be realistic.",
        prompt: `University: ${data.universityName}\nCourse: ${data.course}\nCGPA: ${data.cgpa || "Unknown"}\nProfile: ${JSON.stringify(data.userProfile)}`,
      });
      console.log(`[AI Execution] Success. Generated ${text.length} chars.`);
      return { recommendation: text, confidence: 85 };
    } catch (e: unknown) {
      console.error(`[AI Execution] Failed in getUniversityRecommendation:`, e);
      return { recommendation: "Analysis failed due to a system error.", confidence: 0 };
    }
  });

export const getUniversityComparison = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z
      .object({
        universities: z.array(z.any()),
        userProfile: z.any().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const ai = await createAiProvider(context.userId);
    if (!ai) return { error: "AI is not configured." };

    try {
      console.log(`[AI Execution] Starting getUniversityComparison...`);
      const { object } = await generateObject({
        model: ai(),
        system:
          "You are an expert study-abroad consultant. Compare the provided list of two universities in depth based on the student's profile. You MUST cite sources (like DAAD, University Website, CHE Ranking, QS, Official Course Page) for every major statement. NEVER hallucinate.",
        prompt: `Profile: ${JSON.stringify(data.userProfile || {})}\nUniversities: ${JSON.stringify(data.universities)}`,
        schema: z.object({
          betterMatch: z.string().describe("Which university better matches the student's profile"),
          prosA: z.array(z.string()).describe("Pros for University A"),
          consA: z.array(z.string()).describe("Cons for University A"),
          prosB: z.array(z.string()).describe("Pros for University B"),
          consB: z.array(z.string()).describe("Cons for University B"),
          competitiveness: z.string().describe("Admission competitiveness comparison"),
          curriculum: z.string().describe("Curriculum differences"),
          research: z.string().describe("Research opportunities comparison"),
          internship: z.string().describe("Internship ecosystem comparison"),
          cost: z.string().describe("Cost comparison"),
          living: z.string().describe("Living environment comparison"),
          jobs: z.string().describe("Job opportunities comparison"),
          studentAProfile: z.string().describe("Which student should choose University A"),
          studentBProfile: z.string().describe("Which student should choose University B"),
          recommendation: z.string().describe("Final recommendation"),
          confidence: z.number().describe("Confidence level (0-100)"),
          sources: z.array(z.string()).describe("List of sources used"),
        }),
      });
      console.log(`[AI Execution] Success.`);
      return { analysis: object };
    } catch (e: unknown) {
      console.error(`[AI Execution] Failed in getUniversityComparison:`, e);
      return { error: "Analysis failed due to a system error." };
    }
  });

export const getBudgetAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z
      .object({
        entries: z.array(z.any()),
        totals: z.any(),
        goals: z.array(z.any()),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const ai = await createAiProvider(context.userId);
    if (!ai) return { analysis: "AI is not configured." };

    try {
      console.log(`[AI Execution] Starting getBudgetAnalysis...`);
      const { text } = await generateText({
        model: ai(),
        system:
          "You are a financial advisor for international students in Germany. Analyze the budget and give 3 bullet points: 1) Overspending warning, 2) Saving suggestion, 3) Monthly forecast.",
        prompt: `Totals: ${JSON.stringify(data.totals)}\nEntries: ${JSON.stringify(data.entries)}\nGoals: ${JSON.stringify(data.goals)}`,
      });
      console.log(`[AI Execution] Success. Generated ${text.length} chars.`);
      return { analysis: text };
    } catch (e: unknown) {
      console.error(`[AI Execution] Failed in getBudgetAnalysis:`, e);
      return { analysis: "Analysis failed due to a system error." };
    }
  });

export const getDashboardSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z
      .object({
        profileName: z.string().nullable(),
        daysToGermany: z.number(),
        insights: z.array(z.any()),
        tasks: z.array(z.any()),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const ai = await createAiProvider(context.userId);
    if (!ai) return { summary: "AI is not configured." };

    try {
      console.log(`[AI Execution] Starting getDashboardSummary...`);
      const { text } = await generateText({
        model: ai(),
        system:
          "You are an AI study-abroad mentor. Give a personalized, encouraging 2-sentence summary based on the student's dashboard data. Focus on the most urgent task or insight.",
        prompt: `Name: ${data.profileName}\nDays left: ${data.daysToGermany}\nInsights: ${JSON.stringify(data.insights)}\nTasks: ${JSON.stringify(data.tasks)}`,
      });
      console.log(`[AI Execution] Success. Generated ${text.length} chars.`);
      return { summary: text };
    } catch (e: unknown) {
      console.error(`[AI Execution] Failed in getDashboardSummary:`, e);
      return { summary: "Analysis failed due to a system error." };
    }
  });

export const getCheckinAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z
      .object({
        checkins: z.array(z.any()),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const ai = await createAiProvider(context.userId);
    if (!ai) return { analysis: "AI is not configured." };

    try {
      console.log(`[AI Execution] Starting getCheckinAnalysis...`);
      const { text } = await generateText({
        model: ai(),
        system:
          "You are a motivational coach for language learning. Look at the student's recent daily check-ins. Provide a short 3-sentence encouraging message, noting trends like consistency or areas where they can improve (like vocabulary or study time).",
        prompt: `Checkins: ${JSON.stringify(data.checkins)}`,
      });
      console.log(`[AI Execution] Success. Generated ${text.length} chars.`);
      return { analysis: text };
    } catch (e: unknown) {
      console.error(`[AI Execution] Failed in getCheckinAnalysis:`, e);
      return { analysis: "Analysis failed due to a system error." };
    }
  });

export const getJourneyAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z
      .object({
        tasks: z.array(z.any()),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const ai = await createAiProvider(context.userId);
    if (!ai) return { analysis: "AI is not configured." };

    try {
      console.log(`[AI Execution] Starting getJourneyAnalysis...`);
      const { text } = await generateText({
        model: ai(),
        system:
          "You are an expert guide for moving to Germany. Review the user's task list across all phases. Give a 3-bullet action plan on what they must focus on right now.",
        prompt: `Tasks: ${JSON.stringify(data.tasks)}`,
      });
      console.log(`[AI Execution] Success. Generated ${text.length} chars.`);
      return { analysis: text };
    } catch (e: unknown) {
      console.error(`[AI Execution] Failed in getJourneyAnalysis:`, e);
      return { analysis: "Analysis failed due to a system error." };
    }
  });

export const getDocumentAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z
      .object({
        documents: z.array(z.any()),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const ai = await createAiProvider(context.userId);
    if (!ai) return { analysis: "AI is not configured." };

    try {
      console.log(`[AI Execution] Starting getDocumentAnalysis...`);
      const { text } = await generateText({
        model: ai(),
        system:
          "You are an expert document reviewer for German university applications. Review the user's document vault status. Mention which documents are missing, what's pending, and what they need to upload next. Keep it to 3 bullet points.",
        prompt: `Documents: ${JSON.stringify(data.documents)}`,
      });
      console.log(`[AI Execution] Success. Generated ${text.length} chars.`);
      return { analysis: text };
    } catch (e: unknown) {
      console.error(`[AI Execution] Failed in getDocumentAnalysis:`, e);
      return { analysis: "Analysis failed due to a system error." };
    }
  });

export const getPortfolioAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z
      .object({
        projects: z.array(z.any()),
        certs: z.array(z.any()),
        achievements: z.array(z.any()),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const ai = await createAiProvider(context.userId);
    if (!ai) return { analysis: "AI is not configured." };

    try {
      console.log(`[AI Execution] Starting getPortfolioAnalysis...`);
      const { text } = await generateText({
        model: ai(),
        system:
          "You are an admission committee member for a German university. Review the student's portfolio (projects, certificates, achievements). Give a short 3-sentence evaluation of their profile strength and one area to improve.",
        prompt: `Projects: ${JSON.stringify(data.projects)}\nCertificates: ${JSON.stringify(data.certs)}\nAchievements: ${JSON.stringify(data.achievements)}`,
      });
      console.log(`[AI Execution] Success. Generated ${text.length} chars.`);
      return { analysis: text };
    } catch (e: unknown) {
      console.error(`[AI Execution] Failed in getPortfolioAnalysis:`, e);
      return { analysis: "Analysis failed due to a system error." };
    }
  });
