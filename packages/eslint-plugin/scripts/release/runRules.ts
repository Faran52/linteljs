/**
 * Loads the built plugin and lints one fixture on whatever Node and ESLint are present. CI strips the types on the
 * host and runs the `.mjs` inside `node:14-alpine`, so the syntax stays what Node 14 parses: only a bare floor runtime
 * shows the bundle runs there, since a bundler lowers syntax and leaves built-in methods where they were.
 *
 * Usage: node scripts/release/runRules.ts [path-to-entry]
 */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

interface LintMessage {
  ruleId: string | null;
  fatal?: boolean;
}

// The eslintrc-era `Linter`, which the installed ESLint 10 types no longer describe: `defineRule` left in 9.
interface LegacyLinter {
  defineRule: (id: string, rule: object) => void;
  verify: (code: string, config: object) => LintMessage[];
}

interface LegacyEslint {
  Linter: new () => LegacyLinter;
}

interface BuiltPlugin {
  rules: Record<string, object>;
}

const EXPECTED = ['import-newlines', 'prefer-arrow-functions', 'export-specifier-newline'];

const FIXTURE = [
  "import { alpha, bravo, charlie } from 'mod';",
  '',
  'function greet(name) { return alpha + bravo + charlie + name; }',
  '',
  'export { alpha, bravo };',
  '',
].join('\n');

// ESLint 9 and later have no `defineRule`, so this runner is for 5 to 8, which the container installs.
const isLegacyEslint = (value: unknown): value is LegacyEslint => {
  return typeof value === 'object' && value !== null && 'Linter' in value && typeof value.Linter === 'function'
    && 'defineRule' in value.Linter.prototype;
};

const isBuiltPlugin = (value: unknown): value is BuiltPlugin => {
  return typeof value === 'object' && value !== null && 'rules' in value
    && typeof value.rules === 'object' && value.rules !== null;
};

// `require`, since ESLint 5 and the bundle are CommonJS; resolved from here, which the container copies under
// its own `node_modules`. The entry resolves against the working directory for the same reason.
const require = createRequire(import.meta.url);
const eslint: unknown = require('eslint');

const entry = process.argv[2] === undefined
  ? fileURLToPath(new URL('../../dist/index.js', import.meta.url))
  : resolve(process.cwd(), process.argv[2]);
const plugin: unknown = require(entry);

if (!isLegacyEslint(eslint) || !isBuiltPlugin(plugin)) {
  throw new Error('eslint has no eslintrc Linter (this runner needs 5 to 8), or the built plugin no rules');
}

const linter = new eslint.Linter();
const rules: Record<string, string> = {};

for (const name of EXPECTED) {
  const rule = plugin.rules[name];

  if (rule === undefined) {
    throw new Error(`the built plugin does not register ${name}`);
  }

  linter.defineRule(`@linteljs/${name}`, rule);
  rules[`@linteljs/${name}`] = 'error';
}

const messages = linter.verify(FIXTURE, {
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules,
});
const reported = new Set(messages.map((message) => {
  return message.ruleId;
}));
const fatal = messages.filter((message) => {
  return message.fatal === true;
});
const missing = EXPECTED.filter((name) => {
  return !reported.has(`@linteljs/${name}`);
});

if (fatal.length > 0) {
  throw new Error(`fatal: ${JSON.stringify(fatal)}`);
}

if (missing.length > 0) {
  throw new Error(`no report from ${missing.join(', ')}`);
}

// Not the workspace logger: the container holds this package's `dist/` and `scripts/` and nothing above them.
process.stdout.write(`[INFO] node ${process.versions.node}: all ${String(EXPECTED.length)} rules reported\n`);
