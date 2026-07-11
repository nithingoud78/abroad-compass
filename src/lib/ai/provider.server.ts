import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createAiProvider() {
  return function getAiModel(modelId: string) {
    const provider = process.env.AI_PROVIDER || "google";

    if (provider === "google") {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) throw new Error("Missing GOOGLE_AI_API_KEY");

      const google = createOpenAICompatible({
        name: "google",
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        apiKey,
      });
      return google(modelId);
    }

    if (provider === "openrouter") {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

      const openrouter = createOpenAICompatible({
        name: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        headers: {
          "HTTP-Referer": "https://github.com/nithingoud78/abroad-compass",
          "X-Title": "Abroad Compass",
        },
      });
      return openrouter(modelId);
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  };
}
