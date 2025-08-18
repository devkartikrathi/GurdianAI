/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverExternalPackages: [],
  },
  env: {
    // Add any environment variables you need here
  },
  images: {
    domains: ['images.clerk.dev'],
  },
}

module.exports = nextConfig