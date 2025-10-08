/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    SUMMARY_CACHE_TTL_MS: process.env.SUMMARY_CACHE_TTL_MS || '1800000',
  },
}

module.exports = nextConfig
