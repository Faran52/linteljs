import type { Stage } from '../../model/stages/stages';

// Separate from index.ts: importing the list back in trips import-x/no-cycle.

export interface EmittedText {
  text: string;
}

// Files under `assets/`, concatenated in order.
export interface CopiedAssets {
  sources: string[];
  // Depends on answers, not the file, and takes the project's own text (or `null`) for the checker.
  transform?: (source: string, current: string | null) => string;
}

// Half this CLI's, half the project's: `merge` takes what is on disk, or `null`, and answers the whole file.
export interface MergedText {
  merge: (current: string | null) => string;
}

export type ArtifactContent = CopiedAssets | EmittedText | MergedText;

export interface Artifact {
  // The stage that writes it.
  stage: Stage;
  target: string;
  content: ArtifactContent;
  executable?: boolean;
  // Installed when missing, never overwritten, not even under --force.
  preserve?: true;
}

export const emitted = (stage: Stage, target: string, text: string): Artifact => {
  return {
    stage,
    target,
    content: { text },
  };
};

// A shipped file that lands unchanged. Every one is stage 4.
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
