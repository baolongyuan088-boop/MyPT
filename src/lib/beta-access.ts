import { createHash, timingSafeEqual } from "node:crypto";
export function betaMode() { return process.env.MYPT_BETA_MODE === "1"; }
// One random invitation per tester; only hashes are stored on the server.
export function betaIdentity(code: unknown, now = Date.now()) {
  if (!betaMode() || typeof code !== "string" || code.length < 24 || code.length > 256) return null;
  const expires = Date.parse(process.env.MYPT_BETA_EXPIRES_AT ?? "");
  if (!Number.isFinite(expires) || now >= expires) return null;
  const hash = createHash("sha256").update(code.trim()).digest();
  const entries = (process.env.MYPT_BETA_INVITE_HASHES ?? "").split(",");
  for (const entry of entries) {
    if (!/^[a-f0-9]{64}$/.test(entry)) continue;
    if (timingSafeEqual(hash, Buffer.from(entry, "hex"))) return `beta-${entry.slice(0,32)}`;
  }
  return null;
}
export function betaSessionValid(id: string | undefined, now = Date.now()) {
  if (!id?.startsWith("beta-")) return true;
  return betaMode() && now < Date.parse(process.env.MYPT_BETA_EXPIRES_AT ?? "") &&
    (process.env.MYPT_BETA_INVITE_HASHES ?? "").split(",").some(hash => /^[a-f0-9]{64}$/.test(hash) && id === `beta-${hash.slice(0,32)}`);
}
