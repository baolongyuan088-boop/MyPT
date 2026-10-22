// Local access is deliberately unavailable in production, even if the flag leaks.
export function localMode() {
  return process.env.NODE_ENV === "development" && process.env.MYPT_LOCAL_MODE === "1";
}
export function localRequest(req: Request, mutation = false) {
  const url = new URL(req.url);
  const host = req.headers.get("host");
  const allowed = ["localhost:4000", "127.0.0.1:4000"];
  if (!localMode() || !allowed.includes(url.host) || !host || !allowed.includes(host)) return false;
  const forwarded = req.headers.get("x-forwarded-host");
  if (forwarded && forwarded !== host) return false;
  return !mutation || req.headers.get("origin") === url.origin;
}
