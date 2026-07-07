import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@rehearse/ui", "@rehearse/db"],
};

export default nextConfig;
