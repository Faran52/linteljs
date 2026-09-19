import type { Answers } from '../answers/answers';
import type { ProjectShape } from './projectShape';

// Separate from index.ts: importing the list back in trips import-x/no-cycle.

// A stage is a property of an artifact, so it is declared beside one. Stage 4, `standard`, also
// writes the hooks, the checker, the test setup and the build configs.
export type Stage
  = 'scaffold'
    | 'lint'
    | 'package'
    | 'standard'
    | 'install'
    | 'fix';

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
  // Fresh scaffolder output only. A project owns these from its first run, so a later one leaves them where they are.
  fresh?: true;
  // Written only when this path is already there: a starter test covering source the scaffolder may not have written.
  requires?: string;
  /**
   * A merge `sync` may still delete, because the whole file exists only for the answer that asked for it.
   * `.claude/settings.json` is the case: it carries the project's own keys, and deselecting the host leaves a file
   * with no reason to be there. A merge without this stays, since `pnpm-workspace.yaml` and a tailwind style entry
   * are the project's file with linteljs's lines folded in, not the other way round.
   */
  removable?: true;
}

/**
 * One per directory under `emitters/`, named for that directory, which is itself named for the file it writes.
 * Every emitter answers a list rather than a file, so the condition that decides whether it writes anything is
 * the emitter's own: a target that has no vite config answers `[]` and `buildArtifacts` holds no branch about it.
 * Fewer parameters is fine, since most emitters read only the answers.
 */
export type Emitter = (answers: Answers, project: ProjectShape, name: string) => Artifact[];

export const STAGES: Stage[] = [
  'scaffold',
  'lint',
  'package',
  'standard',
  'install',
  'fix',
];

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
