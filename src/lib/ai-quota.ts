import { reserveUsage } from "./ai-quota-core";
import { libsql } from "@/db/client";
import { auth } from "@/auth";
export async function reserveAICall() {
  const session = await auth();
  if (!session?.user?.id) throw Object.assign(new Error("Sign in required"), { status: 401 });
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
  return reserveUsage(libsql, session.user.id, day);
}
