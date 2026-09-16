import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El SDK local se distribuye como fuente TypeScript; Next lo transpila.
  transpilePackages: ["@demo/culqi"],
  // Build autocontenido para el contenedor Docker.
  output: "standalone",
};

export default nextConfig;
