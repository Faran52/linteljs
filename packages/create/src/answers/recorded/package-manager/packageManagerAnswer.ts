import type { AnswerRecord } from '../../types';

export type PackageManager = keyof typeof packageManagerAnswer.values;

// Never asked: the manager that invoked the CLI, detected from the host. The default is the placeholder that
// detection overwrites before anything reads it.
export const packageManagerAnswer = {
  key: 'packageManager',
  description: 'The package manager that ran create, recorded so sync runs the same one.',
  kind: 'choice',
  values: {
    'pnpm': { label: 'pnpm' },
    'npm': { label: 'npm' },
    'yarn': { label: 'Yarn' },
    // Yarn 1 is a different manager wearing the same command: no `.yarnrc.yml`, no `dlx`, and install scripts it
    // cannot gate. `docs/DESIGN.md` carries what a classic project does not get.
    'yarn-classic': { label: 'Yarn Classic' },
    'bun': { label: 'Bun' },
  },
  default: 'pnpm',
} as const satisfies AnswerRecord;
