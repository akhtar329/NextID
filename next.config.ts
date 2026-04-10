import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Images configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.gstatic.com',  // Sabhi gstatic subdomains
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      // ✅ Aap apni website ke local images ke liye
      {
        protocol: 'https',
        hostname: 'www.nextid.pk',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    // Agar bilkul sab allow karna hai to (not recommended for production)
    // domains: ['*'],  // Next.js 12.3 se pehle ke liye
  },

  async redirects() {
    return [
      // non-www ko www par redirect karo (canonical fix)
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
        // Font files aur static media ko noindex karo
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
        // manifest.json ko bhi noindex karo
        source: "/manifest.json",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;