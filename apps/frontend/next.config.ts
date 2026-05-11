import type { NextConfig } from 'next';

const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@qms/shared'],
  ...(isGithubPages
    ? {
        output: 'export',
        basePath: '/qms-pilot',
        assetPrefix: '/qms-pilot/',
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: 'http://localhost:3005/api/v1/:path*',
            },
          ];
        },
      }),
};

export default nextConfig;
