import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  reactStrictMode: false
};

module.exports = {
  crossOrigin: 'anonymous',
}

export default nextConfig;
