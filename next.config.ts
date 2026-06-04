import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ ENABLE CACHE COMPONENTS
  cacheComponents: true,

  // ✅ Images configuration
  images: {
    // Add unoptimized for local uploads
    unoptimized: process.env.NODE_ENV === 'development', // Optional: for dev only
    
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.gstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blogger.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.nextid.pk',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      // ✅ Add for uploaded images
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        pathname: '/uploads/**',
      },
    ],
    // ✅ Allow local uploads folder
    domains: ['localhost'],
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "nextid.pk" }],
        destination: "https://www.nextid.pk/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/_next/static/media/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex" },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      // ✅ Add cache headers for uploads
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;