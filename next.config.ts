import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site -> `out/` folder, deployable to Cloudflare Pages.
  output: "export",
  // `/vokabular` -> `/vokabular/` so the static host serves index.html cleanly.
  trailingSlash: true,
  // No Image Optimization server in a static export.
  images: { unoptimized: true },
};

export default nextConfig;
