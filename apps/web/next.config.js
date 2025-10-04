const path = require("path");

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias["@shared"] = path.resolve(__dirname, "../../packages/shared");
    return config;
  }
};

module.exports = nextConfig;