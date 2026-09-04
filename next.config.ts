import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  workboxOptions: {
    disableDevLogs: true,
    manifestTransforms: [
      async (manifestEntries) => {
        const manifest = manifestEntries.filter(
          (entry) =>
            !entry.url.includes("marker-icon") &&
            !entry.url.includes("marker-shadow") &&
            !entry.url.includes("routing-icon")
        );
        return { manifest, warnings: [] };
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.tile.openstreetmap.org",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=()" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  experimental: {
    reactCompiler: true,
  },
};

export default withPWA(nextConfig);
