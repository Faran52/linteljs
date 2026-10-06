export const STANDARD_PATHS = [
  {
    path: 'eslint.config.ts',
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
