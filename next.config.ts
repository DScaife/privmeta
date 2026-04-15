import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Fonts never change - cache for 1 year in the browser
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Images / icons / favicons - branding assets that never change
      {
        source: "/:path*\\.(png|ico|jpg|jpeg|svg|webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Web manifest - allow it to refresh daily in case PWA config changes
      {
        source: "/site.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
};

export default nextConfig;
