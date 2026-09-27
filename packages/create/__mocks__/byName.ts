export const byName = (left: string, right: string): number => {
  return left.localeCompare(right, 'en');
};
