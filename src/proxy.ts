import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all locale-prefixed routes; skip Next internals, /api, and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
