import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/**",
      },
      // {
      //   protocol: "http",
      //   hostname: "192.168.1.40",
      //   port: "5001",
      //   pathname: "/upload/products/**",
      // },
    ],
  },
};

export default nextConfig;

