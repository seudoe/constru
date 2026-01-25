import type { NextConfig } from "next"
import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  }
})

const nextConfig: NextConfig = {
  // Netlify deployment configuration
  output: process.env.NETLIFY_DEPLOY === "true" ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: process.env.NETLIFY_DEPLOY === "true",
  },

  // Disable type checking during build (for faster builds)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable ESLint during build (for faster builds)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Dev optimizations
  experimental: {
    optimizePackageImports: undefined,
  },

  productionBrowserSourceMaps: false,
  reactStrictMode: true,

  // Add empty turbopack config to silence warnings
  turbopack: {},

  // Webpack configuration for qrcode library and Netlify compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // For client-side, ensure qrcode works in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

export default withPWA(nextConfig)
