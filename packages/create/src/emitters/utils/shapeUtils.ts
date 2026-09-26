// The target's own spelling where present, the project's first otherwise: a project keeping `styles/global.css`
// beside the standard's entry was once read as the earlier-sorting one.
export const projectSpelling = (own: string, present: readonly string[]): string => {
  return present.includes(own) ? own : present[0] ?? own;
};
