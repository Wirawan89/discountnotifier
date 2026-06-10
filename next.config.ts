import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://192.168.1.176:3003", "192.168.1.176:3003"],
  devIndicators: false,
};

export default nextConfig;
