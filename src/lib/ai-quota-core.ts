import type { Client } from "@libsql/client";
export async function reserveUsage(libsql: Client, userId: string, day: string) {
  const tx = await libsql.transaction("write");
  try {
    for (const [bucket, limit] of [[userId, 20], ["__instance__", 100]] as const) {
      const r = await tx.execute({ sql: "INSERT INTO ai_usage (bucket, day, count) VALUES (?, ?, 1) ON CONFLICT(bucket, day) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count", args: [bucket, day, limit] });
      if (!r.rows.length) throw Object.assign(new Error("Daily limit"), { status: 429 });
    }
    await tx.commit();
  } catch (e) { await tx.rollback(); throw e; }
  finally { tx.close(); }
}
