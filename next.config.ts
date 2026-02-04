import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Enable for Docker optimization
  // Redirect www to non-www to fix cookie domain issues
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.gamjathepug.com' }],
        destination: 'https://gamjathepug.com/:path*',
        permanent: true,
      },
    ];
  },
  ...(process.env.DOCKER_ENV === 'true' && {
    outputFileTracingRoot: '/var/www/html', // Specify workspace root for monorepo
  }),
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'date-fns',
    ],
    // Cache Components and PPR are enabled via cacheComponents: true below
  },
  // @ts-ignore - Cache Components options (Next.js 16+ features)
  // Cache Components enabled - all prerequisites complete
  // Phase A: Security fix (auth before cache pattern)
  // Phase B: Suspense boundaries added to all 12 pages
  cacheComponents: true,
  // Define custom cache profiles
  cacheLife: {
    // Short-lived cache for frequently changing data
    short: {
      stale: 30,      // Serve stale for 30s
      revalidate: 60, // Revalidate after 1 min
      expire: 300,    // Expire after 5 min
    },
    // Medium cache for dashboard/list data
    medium: {
      stale: 60,
      revalidate: 300,  // 5 min
      expire: 900,      // 15 min
    },
    // Long cache for relatively static data
    long: {
      stale: 300,
      revalidate: 3600,  // 1 hour
      expire: 86400,     // 24 hours
    },
    // User-scoped cache (shorter due to personalization)
    userScoped: {
      stale: 30,
      revalidate: 120,  // 2 min
      expire: 600,      // 10 min
    },
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
  turbopack: {
    // Turbopack configuration for client-side builds
    resolveAlias: {
      // Polyfill Node.js modules for xeokit SDK in client bundles
      // We recommend to fix code imports before using this method
      fs: { browser: './lib/empty-module.ts' },
      path: { browser: './lib/empty-module.ts' },
      crypto: { browser: './lib/empty-module.ts' },
      net: { browser: './lib/empty-module.ts' },
      tls: { browser: './lib/empty-module.ts' },
    },
  },
};

export default nextConfig;
