import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // the project has type errors.
    // this is temporal and will be removed in the future
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
