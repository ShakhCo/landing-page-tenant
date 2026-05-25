import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "lcd-and-down-infrared.trycloudflare.com",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
