/*
 * Whether a nav entry is the page being looked at. Its own function because a trailing slash is the case: Astro
 * serves `/about` and `/about/` as the same page, and a header that compared the strings would mark neither.
 */
export const isCurrentPath = (pathname: string, path: string): boolean => {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

  return trimmed === path;
};
