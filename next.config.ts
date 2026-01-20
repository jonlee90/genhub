import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Enable for Docker optimization
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.thdstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'fozwbpqgkcduwxqvmkjd.supabase.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Ignore node modules that don't work in the browser (for xeokit SDK)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
