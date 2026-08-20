import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo lives in a subdirectory of a parent folder that may contain a
  // stray lockfile; pin the workspace root so local builds match CI.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
