import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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