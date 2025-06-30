import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable experimental features if needed
  },
  
  // Add headers for CORS and cookie handling
  async headers() {
    return [
      {
        // Apply headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://xpomatch-dev-event-admin-portal.azurewebsites.net'
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, Cookie'
          },
        ],
      },
    ]
  },

  // Rewrites for API routing if needed
  async rewrites() {
    return [
      // Add any rewrites needed for your API
    ]
  },

  // Image configuration if using next/image
  images: {
    domains: ['localhost', 'xpomatch-dev-event-admin-portal.azurewebsites.net'],
  },

  // Output configuration
  output: 'standalone',

  // Disable strict mode if needed for development
  reactStrictMode: true,

  // Custom webpack configuration if needed
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add custom webpack configurations here
    return config
  },
};

export default nextConfig;
