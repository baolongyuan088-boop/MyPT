import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { betaLogin } from "../src/lib/beta-login";

test("plain beta login validates origin and invitation before setting a session", async () => {
  const code = "private-test-invitation-12345678";
  const saved = { ...process.env };
  Object.assign(process.env, {
    MYPT_BETA_MODE: "1", MYPT_BETA_EXPIRES_AT: "2099-01-01T00:00:00Z",
    MYPT_BETA_INVITE_HASHES: createHash("sha256").update(code).digest("hex"),
    MYPT_ALLOWED_ORIGINS: "https://mypt.example",
  });
  let calls = 0;
  const request = (value: string, origin = "https://mypt.example") => new Request("http://internal.example/api/beta-login", {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code: value, locale: "zh" }),
  });
  try {
    const authenticate = async (value: string) => { assert.equal(value, code); calls++; };
    assert.equal((await betaLogin(request(code, "https://evil.example"), authenticate)).status, 403);
    assert.equal(calls, 0);
    const invalid = await betaLogin(request("invalid"), authenticate);
    assert.equal(invalid.headers.get("location"), "https://mypt.example/zh/signin?error=invite");
    assert.equal(calls, 0);
    const success = await betaLogin(request(code), authenticate);
    assert.equal(success.status, 303);
    assert.equal(success.headers.get("location"), "https://mypt.example/zh/insights");
    assert.equal(calls, 1);
    process.env.MYPT_BETA_EXPIRES_AT = "2000-01-01T00:00:00Z";
    assert.match((await betaLogin(request(code), authenticate)).headers.get("location")!, /error=invite$/);
    assert.equal(calls, 1);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
