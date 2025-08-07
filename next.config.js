/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure environment variables are available
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,
    NEXT_PUBLIC_ENABLE_DEMO_MODE: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE,
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize MUI bundle
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          mui: {
            name: 'mui',
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }
    return config;
  },
  transpilePackages: ['@mui/material', '@mui/system', '@mui/icons-material'],
  async headers() {
    return [
      {
        source: '/iframe/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 