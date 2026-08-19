import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Privacy browser tests may run alongside the normal dev server. A separate
  // cache prevents Next's single-dev-server lock and build artifacts colliding.
  ...(process.env.PRIVMETA_TEST === "1" ? { distDir: ".next-privacy" } : {}),
  // Static export for Cloudflare Pages - there's no Next.js server in production,
  // so headers()/redirects()/rewrites() don't apply; caching is handled by
  // public/_headers instead. See https://nextjs.org/docs/messages/export-no-custom-routes
  output: "export",
  images: {
    unoptimized: true,
  },
};

const configuredNext = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "daniel-kzf",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});

// The privacy harness validates a local static export and does not upload
// source maps or need Sentry's build-time instrumentation.
export default process.env.PRIVMETA_TEST === "1" ? nextConfig : configuredNext;
