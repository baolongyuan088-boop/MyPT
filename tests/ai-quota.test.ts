import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { reserveUsage } from "../src/lib/ai-quota-core";
test("persistent limits separate testers and atomically roll back global rejection", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mypt-quota-"));
  const db = createClient({ url: `file:${join(dir, "test.db")}` });
  try {
    await db.execute("CREATE TABLE ai_usage (bucket TEXT, day TEXT, count INTEGER, PRIMARY KEY(bucket, day))");
    for (let i = 0; i < 20; i++) await reserveUsage(db, "tester-a", "2026-10-22");
    await assert.rejects(reserveUsage(db, "tester-a", "2026-10-22"), { status: 429 });
    await reserveUsage(db, "tester-b", "2026-10-22");
    await db.execute("UPDATE ai_usage SET count=100 WHERE bucket='__instance__'");
    await assert.rejects(reserveUsage(db, "tester-b", "2026-10-22"), { status: 429 });
    const result = await db.execute("SELECT count FROM ai_usage WHERE bucket='tester-b'");
    assert.equal(result.rows[0].count, 1);
    await reserveUsage(db, "tester-a", "2026-10-23");
  } finally { db.close(); await rm(dir, { recursive: true, force: true }); }
});
