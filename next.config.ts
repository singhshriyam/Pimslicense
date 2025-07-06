import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  reactStrictMode: false,
  env:{
    API_BASE_URL:process.env.API_BASE_URL
  }
};

module.exports = {
  crossOrigin: 'anonymous',
}

export default nextConfig;
