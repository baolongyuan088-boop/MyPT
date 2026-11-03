import { betaIdentity, betaMode } from "./beta-access";

export async function betaLogin(request: Request, authenticate: (code: string, locale: string) => Promise<void>) {
  if (!betaMode()) return new Response(null, { status: 404 });
  const origin = request.headers.get("origin");
  const configured = (process.env.MYPT_ALLOWED_ORIGINS ?? "").split(",").map(x => x.trim()).filter(Boolean);
  const allowed = configured.length ? configured : [new URL(request.url).origin];
  if (!origin || !allowed.includes(origin)) return new Response(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
    return new Response(null, { status: 415 });
  }
  const length = Number(request.headers.get("content-length"));
  if (length > 2048) return new Response(null, { status: 413 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 2048) return new Response(null, { status: 413 });
  const fields = new URLSearchParams(raw);
  const locale = ["zh", "en", "tr"].includes(fields.get("locale") ?? "") ? fields.get("locale")! : "zh";
  const destination = (path: string) => new Response(null, {
    status: 303, headers: { Location: new URL(path, origin).href, "Cache-Control": "no-store" },
  });
  const code = fields.get("code")?.trim() ?? "";
  if (!betaIdentity(code)) return destination(`/${locale}/signin?error=invite`);
  await authenticate(code, locale);
  return destination(`/${locale}/insights`);
}
