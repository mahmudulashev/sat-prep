import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep visited dashboard pages in the browser for 30s so moving back and
    // forth between them is instant. Saving a profile or deleting an attempt
    // still refreshes them right away.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
