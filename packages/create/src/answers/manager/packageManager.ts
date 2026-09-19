import type { AnswerRecord } from '../record';

export type PackageManager = keyof typeof packageManager.values;

export const packageManager = {
  key: 'packageManager',
  flag: 'pm',
  prompt: 'Package manager',
  kind: 'choice',
  values: {
    pnpm: {
      label: 'pnpm',
      hint: 'Content-addressed store, strict by default',
    },
    npm: {
      label: 'npm',
      hint: 'Ships with Node',
    },
    yarn: {
      label: 'Yarn',
      hint: 'Yarn Berry with node_modules linking',
    },
    bun: {
      label: 'Bun',
      hint: 'Fast installs; runs scripts under Bun',
    },
  },
  default: 'pnpm',
} as const satisfies AnswerRecord;
