import type { NextConfig } from "next";

const isExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {
        images: {
          remotePatterns: [{ protocol: "https", hostname: "**" }],
        },
      }),
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

export default nextConfig;