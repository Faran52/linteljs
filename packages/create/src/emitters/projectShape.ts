// What a project already holds, per file this CLI has more than one spelling of; one record, so `sync` and
// `create --skip-scaffold` discover the same files.
export interface ProjectShape {
  setupTests: readonly string[];
  styleEntries: readonly string[];
}

// Birth, or planning without reading disk.
export const EMPTY_PROJECT: ProjectShape = {
  setupTests: [],
  styleEntries: [],
};

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
  if (own !== undefined && present.includes(own)) {
    return own;
  }

  return present[0] ?? own;
}
