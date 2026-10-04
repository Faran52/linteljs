import type { PackageManager } from '@config/types';
import type { ChoiceRecord } from '../../types';

// The default is a placeholder detection overwrites before anything reads it.
export const packageManagerAnswer = {
  key: 'packageManager',
  description: 'The package manager that ran create, recorded so sync names the same one in the install it prints.',
  kind: 'choice',
  values: {
    pnpm: { label: 'pnpm' },
    npm: { label: 'npm' },
    yarn: { label: 'Yarn' },
    bun: { label: 'Bun' },
  },
  default: 'pnpm',
} as const satisfies ChoiceRecord<PackageManager>;
