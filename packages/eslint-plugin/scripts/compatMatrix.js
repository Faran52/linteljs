/**
 * Runs the packed plugin against every ESLint major it claims to support. `peerDependencies.eslint` is `>=5.0.0`,
 * and until this existed that was a declaration and nothing more: the suite runs against whichever ESLint the
 * workspace installed, one major, so a rule reading an accessor that moved would pass here and report nothing in
 * a consumer's project. That is the failure `utils/compatUtils.ts` exists to prevent, and this proves it.
 *
 * Each major gets its own directory, its own install, and the config format it actually reads: `.eslintrc.json`
 * extending `plugin:@linteljs/recommended` for 5 through 8, a flat `eslint.config.mjs` spreading
 * `configs['flat/recommended']` for 9 and 10, so both halves of the published `configs` object are exercised by a
 * real consumer. Not part of `pnpm check`: it installs six copies of ESLint from the network and takes minutes,
 * so run it before any release, like `smoke.js`.
 *
 * Usage: node scripts/compatMatrix.js
 */
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import process, { exit } from 'node:process';
import { fileURLToPath } from 'node:url';

const pkgDir = dirname(dirname(fileURLToPath(import.meta.url)));
const matrixDir = join(pkgDir, '.compat');

// The majors the package declares: `5` is the `peerDependencies` floor, `10` is what this workspace develops
// against, and every major between is a real installed base rather than a range endpoint nobody used.
const MAJORS = [5, 6, 7, 8, 9, 10];

// Flat config is the default from 9, and the only format 10 reads.
const isFlat = (major) => {
  return major >= 9;
};

/**
 * One fixture tripping every universal rule in `recommended`, so a major is checked against the whole preset
 * rather than a corner of it. Plain JavaScript on purpose: the two TypeScript-only rules need a parser ESLint 5
 * predates, and installing one per major would test the parser. The two promise rules need opposite shapes:
 * `prefer-await-to-then` stands down on a chain an async function returns, exactly when `prefer-try-catch` speaks
 * up, so one chain cannot reach both and the fixture carries one of each. `ecmaVersion` is stated because ESLint
 * 5 defaults to ES5, where `import` is a parse error.
 */
const FIXTURE = [
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
  'export { alpha, bravo };',
  '',
].join('\n');

const EXPECTED = [
  '@linteljs/destructuring-property-newline',
  '@linteljs/export-specifier-newline',
  '@linteljs/import-newlines',
  '@linteljs/newline-destructuring',
  '@linteljs/no-import-namespace-destructure',
  '@linteljs/prefer-arrow-functions',
  '@linteljs/prefer-destructured-props',
  '@linteljs/prefer-await-to-then',
  '@linteljs/prefer-try-catch',
];

const legacyConfig = JSON.stringify({
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['@linteljs'],
  extends: ['plugin:@linteljs/recommended'],
  // Enrolled by hand: the rule sits outside `recommended`, and it still owes the six-major proof.
  rules: { '@linteljs/prefer-destructured-props': 'error' },
}, null, 2);

const flatConfig = [
  "import lintel from '@linteljs/eslint-plugin';",
  '',
  'export default [',
  "  ...lintel.configs['flat/recommended'],",
  "  { rules: { '@linteljs/prefer-destructured-props': 'error' } },",
  '];',
  '',
].join('\n');

const run = (command, args, cwd) => {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

// The packed tarball, not `src/` or `dist/` by path: what a consumer installs is the tarball, and an entry missing
// from `files` or an `exports` map resolving only in this repo is the defect a matrix over source cannot see.
const packPlugin = () => {
  rmSync(matrixDir, {
    recursive: true,
    force: true,
  });
  mkdirSync(matrixDir, { recursive: true });

  run('npm', ['pack', '--pack-destination', matrixDir], pkgDir);

  const [tarball] = run('ls', [matrixDir], matrixDir).trim().split('\n');

  return join(matrixDir, tarball);
};

const prepare = (major, tarball) => {
  const dir = join(matrixDir, `eslint-${String(major)}`);

  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: `compat-${String(major)}`,
    private: true,
    type: isFlat(major) ? 'module' : 'commonjs',
  }, null, 2));

  run('npm', [
    'install',
    `eslint@${String(major)}`,
    tarball,
    '--no-audit',
    '--no-fund',
    '--silent',
  ], dir);

  writeFileSync(join(dir, 'fixture.js'), FIXTURE);
  writeFileSync(
    join(dir, isFlat(major) ? 'eslint.config.mjs' : '.eslintrc.json'),
    isFlat(major) ? flatConfig : legacyConfig,
  );

  return dir;
};

const lint = (major, dir, fix = false) => {
  const bin = join(dir, 'node_modules', 'eslint', 'bin', 'eslint.js');
  const base = isFlat(major)
    ? [bin, '--no-config-lookup', '-c', 'eslint.config.mjs']
    : [bin, '--no-eslintrc', '-c', '.eslintrc.json'];
  const args = [...base, ...(fix ? ['--fix-dry-run'] : []), '-f', 'json', 'fixture.js'];

  try {
    return run(process.execPath, args, dir);
  }
  catch (error) {
    // ESLint exits non-zero whenever it reports, the expected path here; only output that will not parse fails.
    if (typeof error.stdout === 'string' && error.stdout.trim() !== '') {
      return error.stdout;
    }

    throw new Error(`eslint ${String(major)} produced no parseable output:\n${String(error.stderr)}`);
  }
};

const tarball = packPlugin();
const failures = [];
const fixes = new Map();

for (const major of MAJORS) {
  const dir = prepare(major, tarball);
  const installed = JSON.parse(
    run('node', ['-p', 'JSON.stringify(require("eslint/package.json").version)'], dir),
  );

  let reported = [];
  let fatal = [];

  try {
    const [result] = JSON.parse(lint(major, dir));

    reported = result.messages.map((message) => {
      return message.ruleId;
    });
    fatal = result.messages.filter((message) => {
      return message.fatal;
    });
  }
  catch (error) {
    failures.push(`eslint ${String(major)}: ${String(error.message)}`);
    console.log(`  ✗ eslint ${installed}: ${String(error.message).split('\n')[0]}`);
    continue;
  }

  const missing = EXPECTED.filter((id) => {
    return !reported.includes(id);
  });

  if (fatal.length > 0) {
    failures.push(`eslint ${installed}: fatal ${JSON.stringify(fatal)}`);
    console.log(`  ✗ eslint ${installed}: fatal parse error`);
    continue;
  }

  if (missing.length > 0) {
    failures.push(`eslint ${installed}: no report from ${missing.join(', ')}`);
    console.log(`  ✗ eslint ${installed}: missing ${missing.join(', ')}`);
    continue;
  }

  // The fixed text, not just the report. A rule that reports on every major but rewrites
  // differently on one of them is the worse defect, and it is invisible to a report-only check.
  try {
    const [fixed] = JSON.parse(lint(major, dir, true));

    fixes.set(major, fixed.output ?? '');
  }
  catch (error) {
    failures.push(`eslint ${installed}: fix pass failed: ${String(error.message)}`);
  }

  console.log(`  ✓ eslint ${installed}: all ${String(EXPECTED.length)} rules reported`);
}

// Every major has to emit byte-identical text; the newest is the reference, since the unit suite pins it.
const reference = fixes.get(MAJORS[MAJORS.length - 1]);

for (const [major, output] of fixes) {
  if (output !== reference) {
    failures.push(`eslint ${String(major)}: fixer output differs from the newest major`);
    console.log(`  ✗ eslint ${String(major)}: fixer output differs`);
  }
}

if (fixes.size === MAJORS.length && failures.length === 0) {
  console.log(`\n  ✓ all ${String(MAJORS.length)} majors emit byte-identical fixed output`);
}

if (failures.length > 0) {
  console.error(`\n✗ ${String(failures.length)} of ${String(MAJORS.length)} majors failed:`);

  for (const failure of failures) {
    console.error(`  ${failure}`);
  }

  exit(1);
}

console.log(`\n✓ every rule reports on all ${String(MAJORS.length)} declared majors`);
