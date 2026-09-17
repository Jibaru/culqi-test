import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontenido para el contenedor Docker.
  output: "standalone",
};

export default nextConfig;
