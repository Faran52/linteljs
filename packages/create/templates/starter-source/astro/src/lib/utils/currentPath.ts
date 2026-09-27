// Astro serves `/about` and `/about/` as the same page, so a string comparison would mark neither.
export const isCurrentPath = (pathname: string, path: string): boolean => {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

  return trimmed === path;
};
