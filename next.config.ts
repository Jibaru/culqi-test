import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El SDK local se distribuye como fuente TypeScript; Next lo transpila.
  transpilePackages: ["@demo/culqi"],
};

export default nextConfig;
