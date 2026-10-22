import OpenAI from "openai";
import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { localMode } from "../local-mode";
export const ARK_URL = "https://ark.cn-beijing.volces.com/api/v3";
const configPath = resolve(process.cwd(), ".local-ai.json");
export interface AIConfig { apiKey: string; baseURL: string; model: string }
export async function readAIConfig(): Promise<AIConfig> {
  if (localMode()) {
    try { return JSON.parse(await readFile(configPath, "utf8")); }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
  }
  return {
    apiKey: process.env.AI_API_KEY ?? process.env.ZAI_API_KEY ?? "",
    baseURL: process.env.AI_BASE_URL ?? process.env.ZAI_BASE_URL ?? ARK_URL,
    model: process.env.AI_MODEL ?? process.env.ZAI_MODEL ?? "",
  };
}
export async function saveLocalAI(config: AIConfig) {
  if (!localMode()) throw new Error("Local setup is disabled");
  const tmp = `${configPath}.${crypto.randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(config), { mode: 0o600 });
  await rename(tmp, configPath);
}
export async function getAI() {
  const config = await readAIConfig();
  if (!config.apiKey || !config.model) throw new Error("请先在连接 AI 页面填写密钥和模型 ID。");
  if (process.env.NODE_ENV === "production" || process.env.MYPT_BETA_MODE === "1") {
    const { reserveAICall } = await import("../ai-quota");
    await reserveAICall();
  }
  return { ai: new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL, timeout: 60000, maxRetries: 0 }), model: config.model };
}
export function safeAIError(error: unknown): string {
  const status = (error as { status?: number })?.status;
  if (status === 401 || status === 403) return "密钥无效或没有模型权限，请检查火山方舟配置。";
  if (status === 429) return "调用额度或频率受限，请检查账户余额并稍后重试。";
  if (status === 400 || status === 404) return "模型 ID 或请求参数不匹配，请核对已开通的模型。";
  return "AI 暂时未能回复，请检查连接配置并重试。";
}
