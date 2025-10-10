/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    SUMMARY_CACHE_TTL_MS: process.env.SUMMARY_CACHE_TTL_MS || '1800000',
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('canvas');
    }
    // Fallback for canvas module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    return config;
  },
}

module.exports = nextConfig
