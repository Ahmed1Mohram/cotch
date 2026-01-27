import type { NextConfig } from "next";

const cwd = process.cwd();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dpvzlefvtrlwbogfnldt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "dpvzlefvtrlwbogfnldt.supabase.co",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: cwd,
  },
};

export default nextConfig;
