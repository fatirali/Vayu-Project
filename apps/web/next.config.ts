import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@rehearse/ui", "@rehearse/db"],

  // COEP + COOP are required by LiveKit for SharedArrayBuffer (audio processing).
  // Scoped to /session/* and /actor/session/* only — applying them globally
  // breaks third-party embeds (e.g. cal.com) on other pages.
  async headers() {
    const livekitHeaders = [
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
      { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
    ];
    return [
      { source: "/session/:path*",       headers: livekitHeaders },
      { source: "/actor/session/:path*", headers: livekitHeaders },
    ];
  },
};

export default nextConfig;
