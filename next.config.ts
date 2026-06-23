import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from any R2/CDN domain
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
