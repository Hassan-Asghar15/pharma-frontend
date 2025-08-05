import type { NextConfig } from "next";

// next.config.js
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ allows build to complete even with lint issues
  },
};

module.exports = nextConfig;


export default nextConfig;
