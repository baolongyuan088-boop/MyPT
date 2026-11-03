import { signIn } from "@/auth";
import { betaLogin } from "@/lib/beta-login";
import { AuthError } from "next-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return await betaLogin(request, async (code, locale) => {
      const target = await signIn("invite", { code, redirect: false, redirectTo: `/${locale}/insights` });
      if (typeof target === "string" && new URL(target, request.url).searchParams.has("error")) {
        throw new AuthError("Invitation authentication failed");
      }
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const origin = request.headers.get("origin");
      if (origin) return new Response(null, { status: 303, headers: {
        Location: new URL("/zh/signin?error=invite", origin).href, "Cache-Control": "no-store",
      } });
    }
    return Response.json({ error: "暂时无法登录，请稍后重试。" }, { status: 503 });
  }
}
