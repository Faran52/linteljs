import type { PackageManager } from '@config/types';
import type { ChoiceRecord } from '../../types';

// The default is a placeholder detection overwrites before anything reads it.
export const packageManagerAnswer = {
  key: 'packageManager',
  description: 'The package manager that ran create, recorded so sync runs the same one.',
  kind: 'choice',
  values: {
    'pnpm': { label: 'pnpm' },
    'npm': { label: 'npm' },
    'yarn': { label: 'Yarn' },
    // Yarn 1: no `.yarnrc.yml`, no `dlx`, and install scripts it cannot gate. `docs/DESIGN.md` has the rest.
    'yarn-classic': { label: 'Yarn Classic' },
    'bun': { label: 'Bun' },
  },
  default: 'pnpm',
} as const satisfies ChoiceRecord<PackageManager>;
