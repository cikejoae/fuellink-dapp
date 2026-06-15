/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Cloudflare Pages deployment.
  // All pages are client-side ('use client'), so static export is the right fit.
  output: 'export',

  // Disable Next.js image optimization — it requires a Node.js server.
  // Cloudflare Pages serves the static 'out/' folder directly.
  images: {
    unoptimized: true,
  },

  reactStrictMode: true,

  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    }
    return config
  },
}

module.exports = nextConfig
