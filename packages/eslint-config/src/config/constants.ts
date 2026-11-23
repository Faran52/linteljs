import type { Linter } from 'eslint';

export const TYPESCRIPT_EXTENSIONS = 'ts,tsx,mts,cts';

export const SCRIPT_EXTENSIONS = `js,jsx,mjs,cjs,${TYPESCRIPT_EXTENSIONS}`;

export const SCRIPT_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

// The one test-file table every layer reads; `*` and `/**` endings never pull a file into the lint on their own.
export const TEST_FILES = ['**/*.{test,spec}.*', '**/__tests__/**'];

export const E2E_FILES = ['**/*.e2e.*', '**/e2e/**'];

export const STORY_FILES = ['**/*.stories.*'];

export const MOCK_FILES = ['**/__mocks__/**'];

// For a JSX-in-JS framework, where a `.js` or `.jsx` file holds markup.
export const JS_MARKUP_FILES = ['**/*.{js,jsx}'];

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
  '@stylistic/jsx-self-closing-comp': 'error',
  '@stylistic/jsx-pascal-case': 'error',
} satisfies Linter.RulesRecord;

// Each framework's import group, which its layer exports and `packages/compose` holds its group tables to.
export const REACT_GROUP: string[] = [
  '^react$',
  '^react-dom$',
  '^react/',
  '^react-',
  '^@react',
];

export const NEXT_GROUP: string[] = [
  ...REACT_GROUP,
  '^next$',
  '^next/',
];

export const VUE_GROUP: string[] = [
  '^vue$',
  '^vue-router$',
  '^pinia$',
  '^@vue/',
];

export const NUXT_GROUP: string[] = [
  ...VUE_GROUP,
  '^nuxt$',
  '^nuxt/',
  // Nuxt's own virtual modules, which resolve only inside its build.
  '^#',
];

// No file behind it, so the resolver has nothing to find.
export const SVELTE_VIRTUAL_MODULES = [String.raw`^\$app/`];

export const SVELTE_GROUP: string[] = [
  '^svelte$',
  '^svelte/',
  '^@sveltejs/',
  ...SVELTE_VIRTUAL_MODULES,
  '^#lib(?:/|$)',
];

export const SOLID_GROUP: string[] = [
  '^solid-js$',
  '^solid-js/',
  '^@solidjs/',
];

export const ANGULAR_GROUP: string[] = [
  '^@angular/',
  '^rxjs$',
  '^rxjs/',
];

export const ERROR_PREFIX = '@linteljs/eslint-config:';
