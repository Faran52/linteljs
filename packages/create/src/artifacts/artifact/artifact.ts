import type { Stage } from '../../model/stages/stages';

// Kept separate from index.ts: importing the list back in would trip import-x/no-cycle.

export interface EmittedText {
  text: string;
}

// Files under `assets/`, concatenated in order. `testing.md` joins a per-target head to the shared standard, and
// `type-standards.md` gains a relaxed-floor tail when that answer was chosen.
export interface CopiedAssets {
  sources: string[];
  /**
   * Depends on answers, not the file: type-standards.md's shared glob names .vue and .svelte for every target,
   * including pure React and TypeScript. `current` is the project's own text, or `null` on a first write, for the
   * checker, which is half the standard's and half the project's.
   */
  transform?: (source: string, current: string | null) => string;
}

/**
 * A file this CLI owns some of and the project owns the rest of. `merge` receives whatever is on
 * disk, or `null` on a first write, and answers the whole file. Neither `emitted` nor `preserve`
 * fits: emitting drops the project's half, preserving freezes ours at whatever birth wrote.
 */
export interface MergedText {
  merge: (current: string | null) => string;
}

export type ArtifactContent = CopiedAssets | EmittedText | MergedText;

export interface Artifact {
  // The stage that writes it, and the stage `--skip` declines it with.
  stage: Stage;
  target: string;
  content: ArtifactContent;
  executable?: boolean;
  // The project edits this: sync installs it when missing and never overwrites it, not even under --force.
  preserve?: true;
}

export const emitted = (stage: Stage, target: string, text: string): Artifact => {
  return {
    stage,
    target,
    content: { text },
  };
};

// A shipped file that lands unchanged, from one source or several concatenated. Every one is stage 4, `standard`.
export const copied = (target: string, ...sources: string[]): Artifact => {
  return {
    stage: 'standard',
    target,
    content: { sources },
  };
};

export const merged = (
  stage: Stage,
  target: string,
  merge: (current: string | null) => string,
): Artifact => {
  return {
    stage,
    target,
    content: { merge },
  };
};
