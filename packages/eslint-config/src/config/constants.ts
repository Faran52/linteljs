import type { Linter } from 'eslint';

export const TYPESCRIPT_EXTENSIONS = 'ts,tsx,mts,cts';

export const SCRIPT_EXTENSIONS = `js,jsx,mjs,cjs,${TYPESCRIPT_EXTENSIONS}`;

export const SCRIPT_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

export const SCRIPT_AND_SFC_FILES = [`**/*.{${SCRIPT_EXTENSIONS},vue,svelte}`];

// The JSX frameworks' own, not `base`'s: a `.vue`, `.svelte` or `.astro` template is not JSX.
export const JSX_STYLE_RULES = {
  '@stylistic/jsx-self-closing-comp': ['error', {
    component: true,
    html: true,
  }],
  '@stylistic/jsx-pascal-case': ['error', {
    allowAllCaps: false,
    allowLeadingUnderscore: false,
    allowNamespace: false,
  }],
} satisfies Linter.RulesRecord;
