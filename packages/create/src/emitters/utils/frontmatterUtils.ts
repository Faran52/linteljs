export const withoutClaudePaths = (source: string): string => {
  return source.replace(/^---\npaths:\n(?: {2}- .+\n)+---\n+/u, '');
};
