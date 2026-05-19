/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a minimal self-contained build in .next/standalone —
  // required for Docker so the image doesn't need node_modules at runtime.
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
