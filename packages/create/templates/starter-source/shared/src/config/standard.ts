export const GATE = [
  {
    command: 'pnpm lint',
    runs: 'ESLint, one config, zero warnings',
  },
  {
    command: 'pnpm typecheck',
    runs: 'tsc --noEmit',
  },
  {
    command: 'pnpm test',
    runs: 'vitest, with coverage thresholds',
  },
  {
    command: 'pnpm build',
    runs: 'vite build',
  },
] as const;

export const STANDARD_PATHS = [
  {
    path: 'eslint.config.js',
    holds: 'The layers, imported from @linteljs/eslint-config',
  },
  {
    path: 'plugins/linteljs/skills/linteljs/',
    holds: 'The rules your coding agent reads before it writes',
  },
  {
    path: 'linteljs.config.json',
    holds: 'The answers this project was generated from',
  },
  {
    path: '.husky/',
    holds: 'The gate on every commit, so nothing lands unlinted',
  },
] as const;
