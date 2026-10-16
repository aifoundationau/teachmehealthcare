/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
  experimental: {
    // The local development database ships WebAssembly files that must not be bundled.
    serverComponentsExternalPackages: ["@electric-sql/pglite", "@electric-sql/pglite-pgvector"],
  },
};

export default nextConfig;

