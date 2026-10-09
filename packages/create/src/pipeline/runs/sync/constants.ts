// ESLint's own lookup order, so the first one present is the one it loads.
export const ESLINT_CONFIG_SPELLINGS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
];

export const APP_MANIFESTS = '{apps,packages}/*/package.json';

// Each agent's rule copies; a file in one named for a shipped rule is linteljs's.
export const RULE_DIRECTORIES = [
  '.agents/rules',
  '.cursor/rules',
  '.github/instructions',
  'plugins/linteljs/skills/linteljs/references',
];

export const AGENT_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'copilot-instructions.md',
];

// Their text is the project's, past a projects block that sync owns.
export const ROOT_ADAPTERS = [
  'AGENTS.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
  '.cursor/rules/linteljs.mdc',
];

export const RULE_FRAGMENTS = 'fragments/claude-rules';
