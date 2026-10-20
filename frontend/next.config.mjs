/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    config.resolve.symlinks = false;
    if (dev) {
      // Webpack accepts one RegExp or an array of glob strings here; an array of RegExps fails validation.
      config.watchOptions = {
        ignored: /[\\/](node_modules|\.next|\.git|\.venv|backend)([\\/]|$)/,
      };
    }
    return config;
  },
  experimental: {
    // The local development database ships WebAssembly files that must not be bundled.
    serverComponentsExternalPackages: ["@electric-sql/pglite", "@electric-sql/pglite-pgvector"],
  },
};

export default nextConfig;
