import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  reactStrictMode: false,
  crossOrigin: "anonymous",
  env: {

     API_BASE_URL: "https://pimsapi.apextechno.co.uk/api",
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: "service_h30s1zv",
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: "template_xt88g6m",
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: "pwFf0WygEXe4SRTgB",
  },
};

export default nextConfig;
