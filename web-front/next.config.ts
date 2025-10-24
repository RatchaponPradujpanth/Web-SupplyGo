import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.1.48", // 👈 แก้ให้ตรงกับ error ที่ขึ้น
        port: "5001",
        pathname: "/upload/products/**",
      },
    ],
  },
};

export default nextConfig;

