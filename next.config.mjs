/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ensure Node.js runtime for ffmpeg
    serverComponentsExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static', 'ytdl-core', '@distube/ytdl-core']
  }
};

export default nextConfig;


