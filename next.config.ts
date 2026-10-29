import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Hide the floating "N" dev-tools badge during local development.
  devIndicators: false,
  // A package-lock.json in the user's home folder would otherwise be picked as the workspace root.
  turbopack: { root: __dirname },
  images: {
    // Brand photography currently lives on the live storefront.
    remotePatterns: [
      { protocol: "https", hostname: "www.thecaffix.in", pathname: "/images/**" },
      { protocol: "https", hostname: "www.thecaffix.in", pathname: "/image/**" },
    ],
    qualities: [75],
  },
};

export default nextConfig;
