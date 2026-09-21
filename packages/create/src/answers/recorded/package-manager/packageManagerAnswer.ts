import type { AnswerRecord } from '../../types';

export type PackageManager = keyof typeof packageManagerAnswer.values;

// Never asked: the manager that invoked the CLI, detected from the host. The default is the placeholder that
// detection overwrites before anything reads it.
export const packageManagerAnswer = {
  key: 'packageManager',
  description: 'The package manager that ran create, recorded so sync runs the same one.',
  kind: 'choice',
  values: {
    pnpm: { label: 'pnpm' },
    npm: { label: 'npm' },
    yarn: { label: 'Yarn' },
    bun: { label: 'Bun' },
  },
  default: 'pnpm',
} as const satisfies AnswerRecord;
