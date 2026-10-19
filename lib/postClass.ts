export function getPostClass(type: string): string {
  const map: Record<string, string> = {
    news: 'post-news',
    job: 'post-job',
    admission: 'post-admission',
    result: 'post-result',
    date_sheet: 'post-date-sheet',
    scholarship: 'post-scholarship',
    blog: 'post-blog',
  };
  return map[type] || 'post-blog';
}