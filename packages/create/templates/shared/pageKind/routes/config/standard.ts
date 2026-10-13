// Each `holds` is a key into `src/i18n/locales/`.
export const STANDARD_PATHS = [
  {
    path: 'eslint.config.ts',
    holds: 'standardEslint',
  },
  {
    path: 'plugins/linteljs/skills/linteljs/',
    holds: 'standardSkills',
  },
  {
    path: 'linteljs.config.json',
    holds: 'standardConfig',
  },
  {
    path: '.husky/',
    holds: 'standardHusky',
  },
] as const;
