// `src/meta.test.ts` holds the tree to this, and the root `eslint.config.ts` builds its zones from it.

interface World {
  group: string[];
  message: string;
}

export type Ring = (typeof RINGS)[number];

// Each reads only those after it.
export const INNER_RINGS = [
  'answers',
  'targets',
  'utils',
  'config',
] as const;

export const MIDDLE_RINGS = ['emitters'] as const;

// Named for the world each reaches into, which decides membership.
export const OUTER_RINGS = [
  'disk',
  'pipeline',
  'spawns',
  'terminal',
] as const;

export const RINGS = [
  ...INNER_RINGS,
  ...MIDDLE_RINGS,
  ...OUTER_RINGS,
] as const;

export const WORLDS: Record<'disk' | 'spawns' | 'terminal', World> = {
  disk: {
    group: ['node:fs', 'node:fs/*'],
    message: 'The filesystem lives in disk/. Reach it through the disk/ barrel.',
  },
  spawns: {
    group: ['node:child_process'],
    message: 'Spawning lives in spawns/.',
  },
  terminal: {
    group: ['node:process', '@inquirer/*'],
    message: 'argv and the terminal live in terminal/.',
  },
};
