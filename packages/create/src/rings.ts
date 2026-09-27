// The nine rings of this package and the direction between them, spelled once. `src/meta.test.ts` holds the tree to
// it and the root `eslint.config.ts` builds its zones from it, so the documents point here rather than restating it.

interface World {
  group: string[];
  message: string;
}

export type Ring = (typeof RINGS)[number];

// Reach nothing outside their own set, and within it point one way: answers, targets, utils, config.
export const INNER_RINGS = ['answers', 'config', 'targets', 'utils'] as const;

// Turns answers and targets into file text; reaches inward only.
export const MIDDLE_RINGS = ['emitters'] as const;

// Each named for the world it reaches into, which is what decides membership.
export const OUTER_RINGS = ['disk', 'pipeline', 'spawns', 'terminal'] as const;

export const RINGS = [...INNER_RINGS, ...MIDDLE_RINGS, ...OUTER_RINGS] as const;

// The import that places a module in an outer ring, and the message a module anywhere else gets for it.
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
