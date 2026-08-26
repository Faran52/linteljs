/**
 * What a project already holds, for each file this CLI has more than one spelling of. One record from one producer, so
 * a file discovered for `sync` is discovered for `create --skip-scaffold` too: as loose arguments, `runPipeline` read
 * the setup file and nothing else, and handed a project a second stylesheet nothing imports.
 *
 * Every candidate the project has, in candidate order. Which one it means is `projectSpelling`.
 */
export interface ProjectShape {
  setupTests: readonly string[];
  styleEntries: readonly string[];
}

// Birth, and what a caller planning without reading disk passes.
export const EMPTY_PROJECT: ProjectShape = {
  setupTests: [],
  styleEntries: [],
};

/**
 * The target's own spelling where the project has it, the project's first otherwise. That order because a project can
 * hold several: one keeping a `styles/global.css` beside the standard's entry was read as the earlier-sorting one,
 * which moved the Tailwind import out of the file its other files already name.
 *
 * Overloaded on whether the target declares one, since only some targets declare a style entry and every one has a
 * setup file. Without it the setup caller carries a `?? own` it cannot reach.
 */
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
