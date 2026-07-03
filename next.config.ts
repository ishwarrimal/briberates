import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg has dynamic requires; keep it out of the bundler.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
