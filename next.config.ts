import type { NextConfig } from "next";

if (typeof global !== "undefined") {
  // @ts-ignore
  global.localStorage = undefined;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
