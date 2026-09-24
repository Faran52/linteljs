// The majors the package declares: 5 is the `peerDependencies` floor, 10 what this workspace develops against.
export type Major = 5 | 6 | 7 | 8 | 9 | 10;

export const MAJORS: Major[] = [5, 6, 7, 8, 9, 10];

/**
 * Trips every universal rule in `recommended`, in plain JavaScript: the TypeScript leg below carries its own parser.
 * The two promise rules need opposite shapes, so each gets a chain. `ecmaVersion` is stated because ESLint 5 defaults
 * to ES5. `no-alert` is a core rule on every major, so disabling it is no unknown-rule error.
 */
export const FIXTURE = [
  "import { alpha, bravo, charlie } from 'mod';",
  "import * as helpers from 'helpers';",
  '',
  'const { first, second } = helpers;',
  '',
  'const { one, two, three, four } = alpha;',
  '',
  'const { five, six,',
  '  seven } = bravo;',
  '',
  'function greet(name) { return charlie + name; }',
  '',
  'const Widget = (props) => props.alpha + props.bravo;',
  '',
  'const load = async () => {',
  '  return fetch("/x").then(toJson).catch(report);',
  '};',
  '',
  'const ping = () => {',
  '  helpers.poll().then(toJson);',
  '};',
  '',
  '/** a one-line block, which belongs on a slash line */',
  'const documented = one;',
  '',
  '// eslint-disable-next-line no-alert',
  'const suppressed = two;',
  '',
  'export { alpha, bravo };',
  '',
].join('\n');

export const EXPECTED = [
  '@linteljs/comment-delimiter',
  '@linteljs/destructuring-property-newline',
  '@linteljs/export-specifier-newline',
  '@linteljs/import-newlines',
  '@linteljs/member-newline',
  '@linteljs/no-eslint-disable',
  '@linteljs/no-import-namespace-destructure',
  '@linteljs/prefer-arrow-functions',
  '@linteljs/prefer-destructured-props',
  '@linteljs/prefer-await-to-then',
  '@linteljs/prefer-try-catch',
];

export const legacyConfig = JSON.stringify({
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['@linteljs'],
  extends: ['plugin:@linteljs/recommended'],
  // Outside `recommended`, and still owed the six-major proof.
  rules: { '@linteljs/prefer-destructured-props': 'error' },
}, null, 2);

// Flat config reports unused disable directives by default and `--fix` then deletes one, which would fail the
// byte-identical comparison over a difference in ESLint rather than in this plugin.
export const flatConfig = [
  "import linteljs from '@linteljs/eslint-plugin';",
  '',
  'export default [',
  "  ...linteljs.configs['flat/recommended'],",
  "  { rules: { '@linteljs/prefer-destructured-props': 'error' } },",
  "  { linterOptions: { reportUnusedDisableDirectives: 'off' } },",
  '];',
  '',
].join('\n');

// Each major paired with the `@typescript-eslint/parser` whose peer range accepts it, and that era's TypeScript.
// Asserts this plugin's rules report, never that the parser is right.
export const TS_TOOLING: Record<Major, string[]> = {
  5: ['@typescript-eslint/parser@2.34.0', 'typescript@3.9.10'],
  6: ['@typescript-eslint/parser@2.34.0', 'typescript@3.9.10'],
  7: ['@typescript-eslint/parser@4.33.0', 'typescript@4.4.4'],
  8: ['@typescript-eslint/parser@8.70.0', 'typescript@5.9.3'],
  9: ['@typescript-eslint/parser@8.70.0', 'typescript@5.9.3'],
  10: ['@typescript-eslint/parser@8.70.0', 'typescript@5.9.3'],
};

// One shape per TypeScript-only rule: an inline literal, a union wide enough to break, and an interface after code.
export const TS_FIXTURE = [
  'export const read = (answers: { target: string }): string => {',
  '  return answers.target;',
  '};',
  '',
  // `union-newline` speaks on a *complex* union, one carrying an object arm, not on a row of string literals.
  'export type Wide = { first: string } | { second: string } | string;',
  '',
  'export const value = 1;',
  '',
  'export interface Shape {',
  '  target: string;',
  '}',
  '',
].join('\n');

export const TS_EXPECTED = [
  '@linteljs/interface-order',
  '@linteljs/no-inline-object-types',
  '@linteljs/union-newline',
];

export const tsLegacyConfig = JSON.stringify({
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  plugins: ['@linteljs'],
  rules: Object.fromEntries(TS_EXPECTED.map((id) => {
    return [id, 'error'];
  })),
}, null, 2);

export const tsFlatConfig = [
  "import parser from '@typescript-eslint/parser';",
  "import linteljs from '@linteljs/eslint-plugin';",
  '',
  'export default [',
  '  {',
  "    files: ['**/*.ts'],",
  '    languageOptions: { parser },',
  "    plugins: { '@linteljs': linteljs },",
  '    rules: {',
  ...TS_EXPECTED.map((id) => {
    return `      ${JSON.stringify(id)}: 'error',`;
  }),
  '    },',
  '  },',
  "  { linterOptions: { reportUnusedDisableDirectives: 'off' } },",
  '];',
  '',
].join('\n');
