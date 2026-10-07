// ESLint's own lookup order, so the first one present is the one it loads.
export const ESLINT_CONFIG_SPELLINGS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
];

export const CLAUDE_SETTINGS_PATH = '.claude/settings.json';

// Sync deletes the scripts these named, so the status lines would point at nothing.
export const RENAMED_STATUS_LINES = [
  ['plugins/linteljs/hooks/mainStatusLine.ts', 'plugins/linteljs/hooks/mainStatusLineHook.ts'],
  ['plugins/linteljs/hooks/subagentStatusLine.ts', 'plugins/linteljs/hooks/subagentStatusLineHook.ts'],
] as const;
