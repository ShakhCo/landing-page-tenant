import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "lcd-and-down-infrared.trycloudflare.com",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
