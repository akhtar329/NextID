import type { Metadata } from "next";

const BASE_URL = "https://www.nextid.pk";

type SEOProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

export function generateSEO({
  title = "Latest Education News, Results & Admissions in Pakistan | NextID",
  description = "Get latest education news, board results, test dates, admissions updates, and exam information across Pakistan.",
  path = "",
  image = "/og-image.png",
  noIndex = false,
}: SEOProps = {}): Metadata {
  const url = `${BASE_URL}${path}`;

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),

    alternates: {
      canonical: url,
    },

    robots: {
      index: !noIndex,
      follow: !noIndex,
    },

    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "NextID",
      locale: "en_PK",
      images: [
        {
          url: `${BASE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}${image}`],
    },
  };
}
