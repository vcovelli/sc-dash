require("dotenv").config();

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL || // fallback if not using NEXT_PUBLIC_*
  "http://localhost:8000";   // sensible local default

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  // If using Next.js 15+, you might want to add allowedDevOrigins:
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.1.42:3000",
    "https://supplywise.ai",
    "http://supplywise.ai",
  ]
};

module.exports = nextConfig;
