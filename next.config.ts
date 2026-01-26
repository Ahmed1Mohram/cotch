import type { NextConfig } from "next";
import path from "path";

const cwd = process.cwd();
const inferredRoot = path.basename(cwd).toLowerCase() === "fit-coach" ? cwd : path.join(cwd, "fit-coach");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: inferredRoot,
  },
};

export default nextConfig;
