import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/host/dashboard", destination: "/library", permanent: true },
      { source: "/host/dashboard/create", destination: "/create", permanent: true },
      { source: "/host/dashboard/history", destination: "/history", permanent: true },
      { source: "/host/dashboard/how-to", destination: "/how-to", permanent: true },
      { source: "/host/game/:id", destination: "/host/:id", permanent: true },
    ];
  },
};

export default nextConfig;
