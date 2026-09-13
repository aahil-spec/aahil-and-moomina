/** @type {import("next").NextConfig} */
const nextConfig = {
  // Allow the custom server (server.ts) to run next.js programmatically
  // This disables the file-system caching that conflicts with custom servers
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "peach.blender.org" },
      { protocol: "https", hostname: "commondatastorage.googleapis.com" },
    ],
  },
};

export default nextConfig;