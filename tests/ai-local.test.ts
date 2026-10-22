import test from "node:test";
import assert from "node:assert/strict";
import { localMode, localRequest } from "../src/lib/local-mode";
import { safeAIError } from "../src/lib/ai/client";
const env = process.env as Record<string, string | undefined>;
function request(origin = "http://localhost:4000", host = "localhost:4000") {
  return new Request("http://localhost:4000/api/ai-config", { headers: { host, origin } });
}
test("local setup requires development flag and exact same origin", () => {
  const old = { node: env.NODE_ENV, flag: env.MYPT_LOCAL_MODE };
  try {
    env.NODE_ENV = "development"; env.MYPT_LOCAL_MODE = "1";
    assert.equal(localRequest(request(), true), true);
    assert.equal(localRequest(request("https://attacker.example"), true), false);
    assert.equal(localRequest(request("http://localhost:4000", "attacker.example")), false);
    assert.equal(localRequest(new Request("http://localhost:4000/api/ai-config", { headers: { host: "localhost:4000" } }), true), false);
    assert.equal(localRequest(new Request("http://localhost:4000/api/ai-config", { headers: { host: "localhost:4000", "x-forwarded-host": "attacker.example" } })), false);
    env.NODE_ENV = "production";
    assert.equal(localMode(), false);
    assert.equal(localRequest(request(), true), false);
    env.NODE_ENV = "development"; delete env.MYPT_LOCAL_MODE;
    assert.equal(localMode(), false);
  } finally {
    if (old.node === undefined) delete env.NODE_ENV; else env.NODE_ENV = old.node;
    if (old.flag === undefined) delete env.MYPT_LOCAL_MODE; else env.MYPT_LOCAL_MODE = old.flag;
  }
});
test("provider errors never echo secrets or raw request details", () => {
  for (const status of [400, 401, 403, 404, 429, 500, undefined]) {
    const result = safeAIError({ status, message: "secret-key-and-request-body" });
    assert.ok(result.length > 0);
    assert.ok(!result.includes("secret-key"));
  }
});
