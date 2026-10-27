import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // <-- Ini untuk upload file besar dari HP
    },
  },
  cacheComponents: true, // <-- WAJIB ADA untuk `export const instant = false`
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;