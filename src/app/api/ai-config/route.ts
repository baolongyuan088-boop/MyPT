import { auth } from "@/auth";
import { localRequest } from "@/lib/local-mode";
import { ARK_URL, readAIConfig, saveLocalAI, safeAIError } from "@/lib/ai/client";
import OpenAI from "openai";
import { z } from "zod";
export const runtime = "nodejs";
async function allowed(req: Request, mutation = false) {
  return localRequest(req, mutation) && (await auth())?.user?.id === "local-owner";
}
export async function GET(req: Request) {
  if (!await allowed(req)) return Response.json({ error: "仅支持本机体验账号" }, { status: 403 });
  const config = await readAIConfig();
  return Response.json({ configured: !!config.apiKey, model: config.model }, { headers: { "Cache-Control": "no-store" } });
}
const Body = z.object({ apiKey: z.string().trim().max(512), model: z.string().trim().min(1).max(150).regex(/^[a-zA-Z0-9._:-]+$/) });
export async function POST(req: Request) {
  if (!await allowed(req, true)) return Response.json({ error: "仅支持本机同源操作" }, { status: 403 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "请填写有效的模型 ID 和密钥" }, { status: 400 });
  const previous = await readAIConfig();
  const apiKey = body.data.apiKey || (previous.baseURL === ARK_URL ? previous.apiKey : "");
  if (!apiKey) return Response.json({ error: "请先填写 API Key" }, { status: 400 });
  try {
    const ai = new OpenAI({ apiKey, baseURL: ARK_URL, timeout: 60000, maxRetries: 0 });
    const result = await ai.chat.completions.create({
      model: body.data.model,
      messages: [{ role: "user", content: "请只回复：连接成功" }],
      max_tokens: 256,
      ...({ thinking: { type: "disabled" } } as object),
    });
    if (!result.choices[0]?.message.content?.trim()) return Response.json({ error: "模型返回空回复，配置尚未保存，请检查模型。" }, { status: 502 });
    await saveLocalAI({ apiKey, baseURL: ARK_URL, model: body.data.model });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: safeAIError(error) }, { status: 502 });
  }
}
