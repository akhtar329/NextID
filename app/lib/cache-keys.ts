// Central cache key management

export const CACHE_KEYS = {
  redirect: (path: string) => `redirect:${path}`,

  admissions: "admissions:list",
  admission: (slug: string) => `admission:${slug}`,

  results: "results:list",
  result: (slug: string) => `result:${slug}`,

  news: "news:list",
  newsItem: (slug: string) => `news:${slug}`,

  boards: "boards:list",
  cities: "cities:list",
};