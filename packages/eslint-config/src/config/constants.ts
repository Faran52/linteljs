import type { Linter } from 'eslint';

export const TYPESCRIPT_EXTENSIONS = 'ts,tsx,mts,cts';

export const SCRIPT_EXTENSIONS = `js,jsx,mjs,cjs,${TYPESCRIPT_EXTENSIONS}`;

export const SCRIPT_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

export const SCRIPT_AND_SFC_FILES = [`**/*.{${SCRIPT_EXTENSIONS},vue,svelte}`];

// `@stylistic`'s `recommended` JSX set, which `base` builds its preset without: a `.ts` or `.vue` file holds no JSX.
// An `.astro` template parses as JSX, so `astro()` reads these too.
export const JSX_LAYOUT_RULES = {
  '@stylistic/jsx-closing-bracket-location': ['error', 'tag-aligned'],
  '@stylistic/jsx-closing-tag-location': ['error', 'tag-aligned'],
  '@stylistic/jsx-curly-brace-presence': ['error', { propElementValues: 'always' }],
  '@stylistic/jsx-curly-newline': ['error', 'consistent'],
  '@stylistic/jsx-curly-spacing': ['error', 'never'],
  '@stylistic/jsx-equals-spacing': ['error', 'never'],
  '@stylistic/jsx-first-prop-new-line': ['error', 'multiline-multiprop'],
  '@stylistic/jsx-function-call-newline': ['error', 'multiline'],
  '@stylistic/jsx-indent-props': ['error', 2],
  // The preset's `when: 'multiline'` caps nothing on a one-line element.
  '@stylistic/jsx-max-props-per-line': ['error', {
    maximum: {
      single: 2,
      multi: 1,
    },
  }],
  '@stylistic/jsx-one-expression-per-line': ['error', { allow: 'single-child' }],
  '@stylistic/jsx-quotes': ['error', 'prefer-double'],
  '@stylistic/jsx-tag-spacing': ['error', {
    afterOpening: 'never',
    beforeClosing: 'never',
    beforeSelfClosing: 'always',
    closingSlash: 'never',
  }],
  '@stylistic/jsx-wrap-multilines': ['error', {
    arrow: 'parens-new-line',
    assignment: 'parens-new-line',
    condition: 'parens-new-line',
    declaration: 'parens-new-line',
    logical: 'parens-new-line',
    prop: 'parens-new-line',
    propertyValue: 'parens-new-line',
    return: 'parens-new-line',
  }],
} satisfies Linter.RulesRecord;

// The JSX frameworks' own, not `base`'s: a `.vue`, `.svelte` or `.astro` template is not JSX.
export const JSX_STYLE_RULES = {
  ...JSX_LAYOUT_RULES,
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
