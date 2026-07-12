import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function createAiProvider(userId?: string) {
  let provider = process.env.AI_PROVIDER || "google";
  let apiKey = process.env.GOOGLE_AI_API_KEY || "";
  let openRouterKey = process.env.OPENROUTER_API_KEY || "";
  let openAiKey = process.env.OPENAI_API_KEY || "";
  let customKey = "";
  let customUrl = "";
  let defaultModel = "google/gemini-2.5-flash";

  // 1. Fetch Global Config
  const { data: globalSettings } = await supabaseAdmin.from("system_settings").select("key, value");

  if (globalSettings) {
    const defaultProvider = globalSettings.find((s) => s.key === "ai_provider_default")?.value;
    if (defaultProvider) provider = String(defaultProvider).replace(/['"]/g, "");

    const defaultModelSetting = globalSettings.find((s) => s.key === "ai_model_default")?.value;
    if (defaultModelSetting) defaultModel = String(defaultModelSetting).replace(/['"]/g, "");

    const globalGoogleKey = globalSettings.find((s) => s.key === "ai_google_key")?.value;
    if (globalGoogleKey) apiKey = String(globalGoogleKey).replace(/['"]/g, "");

    const globalOpenRouterKey = globalSettings.find((s) => s.key === "ai_openrouter_key")?.value;
    if (globalOpenRouterKey) openRouterKey = String(globalOpenRouterKey).replace(/['"]/g, "");

    const globalOpenAiKey = globalSettings.find((s) => s.key === "ai_openai_key")?.value;
    if (globalOpenAiKey) openAiKey = String(globalOpenAiKey).replace(/['"]/g, "");

    const globalCustomKey = globalSettings.find((s) => s.key === "ai_custom_key")?.value;
    if (globalCustomKey) customKey = String(globalCustomKey).replace(/['"]/g, "");

    const globalCustomUrl = globalSettings.find((s) => s.key === "ai_custom_url")?.value;
    if (globalCustomUrl) customUrl = String(globalCustomUrl).replace(/['"]/g, "");
  }

  // 2. Override with User BYOK Config
  if (userId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (supabaseAdmin as any)
      .from("ai_user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userSettings: any = res.data;

    if (userSettings) {
      if (userSettings.provider) provider = userSettings.provider;
      if (userSettings.model) defaultModel = userSettings.model;
      const userCustomKey = userSettings.custom_api_key as string | undefined;
      if (userCustomKey) {
        if (provider === "google") apiKey = userCustomKey;
        else if (provider === "openrouter") openRouterKey = userCustomKey;
        else if (provider === "openai") openAiKey = userCustomKey;
        else if (provider === "custom") customKey = userCustomKey;
      }
      if (userSettings.base_url && provider === "custom") {
        customUrl = userSettings.base_url;
      }
    }
  }

  return function getAiModel(modelIdOverride?: string) {
    const modelId = modelIdOverride || defaultModel;

    if (provider === "google") {
      if (!apiKey) throw new Error("Google API Key Missing. Please configure it in settings.");
      const google = createOpenAICompatible({
        name: "google",
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        apiKey,
      });
      return google(modelId);
    }

    if (provider === "openrouter") {
      if (!openRouterKey)
        throw new Error("OpenRouter API Key Missing. Please configure it in settings.");
      const openrouter = createOpenAICompatible({
        name: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openRouterKey,
        headers: {
          "HTTP-Referer": "https://github.com/nithingoud78/abroad-compass",
          "X-Title": "Abroad Compass",
        },
      });
      return openrouter(modelId);
    }

    if (provider === "openai") {
      if (!openAiKey) throw new Error("OpenAI API Key Missing. Please configure it in settings.");
      const openai = createOpenAICompatible({
        name: "openai",
        baseURL: "https://api.openai.com/v1",
        apiKey: openAiKey,
      });
      return openai(modelId);
    }

    if (provider === "custom") {
      if (!customKey)
        throw new Error("Custom Provider API Key Missing. Please configure it in settings.");
      if (!customUrl)
        throw new Error("Custom Provider Base URL Missing. Please configure it in settings.");
      const customAi = createOpenAICompatible({
        name: "custom",
        baseURL: customUrl,
        apiKey: customKey,
      });
      return customAi(modelId);
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  };
}
