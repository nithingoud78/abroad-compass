// Client-safe model registry. Server helpers re-export these.
export const AI_MODELS = {
  fast: "google/gemini-3-flash-preview",
  balanced: "google/gemini-2.5-flash",
  pro: "google/gemini-2.5-pro",
  gpt_mini: "openai/gpt-5-mini",
  gpt: "openai/gpt-5",
} as const;

export type AiModelKey = keyof typeof AI_MODELS;
export const AI_MODEL_IDS: string[] = Object.values(AI_MODELS);
