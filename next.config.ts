import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Make the bare domain work even when the host routes only locale pages.
  async redirects() {
    return [{ source: "/", destination: "/zh", permanent: false }];
  },
  experimental: {
    // optional perf
  },
  // PWA assets are served from /public; service worker is registered client-side.
};

export default withNextIntl(nextConfig);
