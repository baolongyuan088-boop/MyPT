import OpenAI from "openai";

const apiKey = process.env.ZAI_API_KEY;
const baseURL = process.env.ZAI_BASE_URL ?? "https://api.z.ai/api/paas/v4/";

if (!apiKey) {
  // Only throw at call time; module may be imported in build contexts.
  // eslint-disable-next-line no-console
  console.warn("ZAI_API_KEY is not set — AI calls will fail at runtime.");
}

export const ai = new OpenAI({
  apiKey: apiKey ?? "missing",
  baseURL,
});

export const MODEL = process.env.ZAI_MODEL ?? "glm-5.1";
