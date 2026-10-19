// lib/generateSchema.ts

interface SchemaInput {
  title: string;
  description: string;
  image: string;
  url: string;
  authorName: string;
  publishedAt: string;
  updatedAt?: string;
  type: string;
  meta?: Record<string, unknown>;
}

export function generateSchema(data: SchemaInput): string {
  const base = {
    "@context": "https://schema.org",
    "@type": getSchemaType(data.type),
    headline: data.title,
    description: data.description,
    image: data.image,
    url: data.url,
    datePublished: data.publishedAt,
    dateModified: data.updatedAt || data.publishedAt,
    author: {
      "@type": "Person",
      name: data.authorName || "NextID Editorial",
    },
    publisher: {
      "@type": "Organization",
      name: "NextID.pk",
      logo: {
        "@type": "ImageObject",
        url: "https://www.nextid.pk/logo.png",
      },
    },
  };

  // Post-type specific additions
  if (data.type === "job" && data.meta) {
    return JSON.stringify({
      ...base,
      "@type": "JobPosting",
      title: data.title,
      description: data.description,
      datePosted: data.publishedAt,
      validThrough: data.meta.deadline || undefined,
      hiringOrganization: {
        "@type": "Organization",
        name: data.meta.company || "Unknown",
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: data.meta.location || "Pakistan",
          addressCountry: "PK",
        },
      },
      employmentType: data.meta.jobType || "FULL_TIME",
      baseSalary: data.meta.salary
        ? {
            "@type": "MonetaryAmount",
            currency: "PKR",
            value: {
              "@type": "QuantitativeValue",
              value: data.meta.salary,
            },
          }
        : undefined,
    }, null, 2);
  }

  if (data.type === "scholarship" && data.meta) {
    return JSON.stringify({
      ...base,
      "@type": "EducationalOccupationalProgram",
      name: data.title,
      description: data.description,
      provider: {
        "@type": "Organization",
        name: data.meta.organization || "Unknown",
      },
      educationalCredentialAwarded: data.meta.amount || undefined,
      applicationDeadline: data.meta.deadline || undefined,
    }, null, 2);
  }

  if (data.type === "admission" && data.meta) {
    return JSON.stringify({
      ...base,
      "@type": "EducationalOccupationalProgram",
      name: data.title,
      description: data.description,
      provider: {
        "@type": "EducationalOrganization",
        name: data.meta.institute || "Unknown",
      },
      programPrerequisites: data.meta.eligibility || undefined,
      timeToComplete: data.meta.session || undefined,
    }, null, 2);
  }

  if (data.type === "news") {
    return JSON.stringify({
      ...base,
      "@type": "NewsArticle",
    }, null, 2);
  }

  return JSON.stringify(base, null, 2);
}

function getSchemaType(type: string): string {
  const map: Record<string, string> = {
    news: "NewsArticle",
    blog: "BlogPosting",
    job: "JobPosting",
    admission: "Article",
    result: "Article",
    date_sheet: "Article",
    scholarship: "Article",
  };
  return map[type] || "Article";
}