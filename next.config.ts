import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["tldraw", "@tldraw/editor", "@tldraw/store", "@tldraw/utils", "@tldraw/state"],
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg"],
};

export default nextConfig;
