import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
{
  protocol: "http",
  hostname: "192.168.1.34",
  port: "5001",
  pathname: '/**',
},
    ],
  },
};

export default nextConfig;

