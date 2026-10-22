import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { betaIdentity, betaSessionValid } from "../src/lib/beta-access";
test("invitations isolate testers, expire, and revoke existing sessions", () => {
  const names = ["MYPT_BETA_MODE", "MYPT_BETA_INVITE_HASHES", "MYPT_BETA_EXPIRES_AT"];
  const old = names.map(n => process.env[n]);
  const a = "tester-a-012345678901234567890123456789";
  const b = "tester-b-012345678901234567890123456789";
  const hash = (s: string) => createHash("sha256").update(s).digest("hex");
  try {
    process.env.MYPT_BETA_MODE = "1";
    process.env.MYPT_BETA_INVITE_HASHES = `${hash(a)},${hash(b)}`;
    process.env.MYPT_BETA_EXPIRES_AT = "2030-01-01T00:00:00Z";
    const now = Date.parse("2026-10-22T00:00:00Z");
    assert.ok(betaIdentity(a, now));
    assert.notEqual(betaIdentity(a, now), betaIdentity(b, now));
    assert.equal(betaIdentity("wrong-code-012345678901234567890", now), null);
    assert.equal(betaIdentity(a, Date.parse("2030-01-01T00:00:00Z")), null);
    const id = betaIdentity(a, now)!;
    assert.ok(betaSessionValid(id, now));
    process.env.MYPT_BETA_INVITE_HASHES = hash(b);
    assert.equal(betaSessionValid(id, now), false);
    delete process.env.MYPT_BETA_EXPIRES_AT;
    assert.equal(betaIdentity(b, now), null);
    process.env.MYPT_BETA_MODE = "0";
    assert.equal(betaIdentity(b, now), null);
    assert.equal(betaSessionValid(id, now), false);
  } finally { names.forEach((n, i) => { if (old[i] === undefined) delete process.env[n]; else process.env[n] = old[i]; }); }
});
