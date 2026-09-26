// The target's own spelling where present, the project's first otherwise: a project keeping `styles/global.css`
// beside the standard's entry was once read as the earlier-sorting one.
export function projectSpelling(own: string, present: readonly string[]): string;
export function projectSpelling(
  own: string | undefined,
  present: readonly string[],
): string | undefined;
export function projectSpelling(
  own: string | undefined,
  present: readonly string[],
): string | undefined {
  const kept = present.find((path) => {
    return path === own;
  });

  return kept ?? present[0] ?? own;
}
