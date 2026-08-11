import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow devices on the network (phone, projector laptop) to load the dev
  // server's assets — dev only; this setting has no effect in production.
  allowedDevOrigins: ["*", "192.168.1.61", "192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
