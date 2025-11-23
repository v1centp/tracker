import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((v) => v.trim()).filter(Boolean)
    : ["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000", "http://172.20.10.2:3000"],
};
export default nextConfig;
