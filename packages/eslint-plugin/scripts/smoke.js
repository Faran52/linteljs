/**
 * Smoke test for the *packed* artifact. `pnpm test` exercises the TypeScript sources; this checks the thing that
 * actually reaches npm, packing the tarball, extracting it, and running a real ESLint over a fixture through both
 * the ESM and the CJS entry point. Unit tests cannot catch a missing entry in `files`, a broken `exports` map, or
 * a CJS build that throws on `require`. This does.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const smokeDir = join(root, '.smoke');
const pkgDir = join(smokeDir, 'package');

const run = (cmd, args, cwd = root) => {
  return execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
};

rmSync(smokeDir, {
  recursive: true,
  force: true,
});
mkdirSync(smokeDir, { recursive: true });

console.log('• packing tarball');
run('pnpm', ['pack', '--pack-destination', smokeDir]);

const tarball = readdirSync(smokeDir).find((file) => {
  return file.endsWith('.tgz');
});
assert.ok(tarball, 'pnpm pack produced no tarball');

console.log(`• extracting ${tarball}`);
run('tar', ['-xzf', join(smokeDir, tarball)], smokeDir);

// A fixture that trips several rules at once, so a silently-unregistered rule
// shows up as a missing message rather than passing quietly.
const fixture = [
  "import { alpha, bravo, charlie } from 'mod';",
  '',
  'function greet(name) { return alpha + bravo + charlie + name; }',
  '',
  'export { alpha, bravo };',
  '',
].join('\n');

const expectedRuleIds = [
  '@linteljs/import-newlines',
  '@linteljs/prefer-arrow-functions',
  '@linteljs/export-specifier-newline',
];

/**
 * Both shapes under both names, which is what has been published since 1.0.0. The bare names are
 * the eslintrc objects and the `flat/` twins are the arrays; a consumer on `eslint >=5` reaches
 * for the first and one on flat config reaches for the second. Written out rather than read from
 * the source under test, so a rename fails here rather than in somebody's config.
 */
const expectedPresetNames = [
  'flat/functions',
  'flat/imports',
  'flat/layout',
  'flat/ordering',
  'flat/promises',
  'flat/recommended',
  'functions',
  'imports',
  'layout',
  'ordering',
  'promises',
  'recommended',
];

// The preset spread a consumer actually writes. The configs below name their
// rules by hand, so they would pass with every preset key misspelled.
const esmPresetConfig = (pluginPath) => {
  return [
    `import lintel from ${JSON.stringify(pluginPath)};`,
    '',
    'export default [',
    '  ...lintel.configs[\'flat/recommended\'],',
    '];',
    '',
  ].join('\n');
};

const esmConfig = (pluginPath) => {
  return [
    `import lintel from ${JSON.stringify(pluginPath)};`,
    '',
    'export default [',
    '  { plugins: { \'@linteljs\': lintel }, rules: {',
    ...expectedRuleIds.map((id) => {
      return `    ${JSON.stringify(id)}: 'error',`;
    }),
    '  } },',
    '];',
    '',
  ].join('\n');
};

const cjsConfig = (pluginPath) => {
  return [
    `const lintel = require(${JSON.stringify(pluginPath)});`,
    '',
    'module.exports = [',
    '  { plugins: { \'@linteljs\': lintel }, rules: {',
    ...expectedRuleIds.map((id) => {
      return `    ${JSON.stringify(id)}: 'error',`;
    }),
    '  } },',
    '];',
    '',
  ].join('\n');
};

const eslintBin = join(root, 'node_modules', 'eslint', 'bin', 'eslint.js');

const checkFlavour = (name, configFile, configSource) => {
  const dir = join(smokeDir, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, configFile), configSource);
  writeFileSync(join(dir, 'fixture.js'), fixture);

  let output;

  try {
    output = execFileSync(
      process.execPath,
      [eslintBin, '--no-config-lookup', '-c', configFile, '-f', 'json', 'fixture.js'],
      {
        cwd: dir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      },
    );
  }
  catch (error) {
    // ESLint exits non-zero when it reports problems, which is the expected
    // path here. Anything without parseable stdout is a genuine failure.
    output = error.stdout;

    if (!output) {
      throw error;
    }
  }

  const [result] = JSON.parse(output);
  const reported = new Set(result.messages.map((message) => {
    return message.ruleId;
  }));

  const fatal = result.messages.filter((message) => {
    return message.fatal;
  });
  assert.equal(fatal.length, 0, `${name}: fatal parse error: ${JSON.stringify(fatal)}`);

  for (const ruleId of expectedRuleIds) {
    assert.ok(reported.has(ruleId), `${name}: expected ${ruleId} to report, got ${[...reported].join(', ')}`);
  }

  // Rule ids that fired on the fixture, not rules the plugin ships. "reported 3 rule(s)"
  // read as the latter and sent a reviewer hunting for eight missing rules.
  const expected = expectedRuleIds.length;

  console.log(`  ✓ ${name} entry loaded, ${reported.size}/${expected} expected rule ids fired on the fixture`);
};

console.log('• checking ESM entry');
checkFlavour('esm', 'eslint.config.mjs', esmConfig(pathToFileURL(join(pkgDir, 'dist', 'index.mjs')).href));

console.log('• checking CJS entry');
checkFlavour('cjs', 'eslint.config.cjs', cjsConfig(join(pkgDir, 'dist', 'index.js')));

console.log('• checking the recommended preset spread');
checkFlavour(
  'esm-preset',
  'eslint.config.mjs',
  esmPresetConfig(pathToFileURL(join(pkgDir, 'dist', 'index.mjs')).href),
);

// A `.cjs` flat config receives the module namespace from `require`, an ESM one the default export. Both have to
// be a usable plugin on their own, or `plugins: { '@linteljs': lintel }` silently loses `meta` in one of them.
const cjsNamespace = (await import(pathToFileURL(join(pkgDir, 'dist', 'index.js')).href)).default;
const esmDefault = (await import(pathToFileURL(join(pkgDir, 'dist', 'index.mjs')).href)).default;

for (const [label, shape] of [['cjs require()', cjsNamespace], ['esm default', esmDefault]]) {
  assert.ok(shape?.rules, `${label}: no \`rules\``);
  assert.ok(shape?.configs, `${label}: no \`configs\``);
  assert.ok(shape?.meta?.name, `${label}: no \`meta.name\``);
  assert.ok(shape?.meta?.version, `${label}: no \`meta.version\``);

  assert.deepEqual(
    Object.keys(shape.configs).sort(),
    expectedPresetNames,
    `${label}: published preset names changed`,
  );

  /**
   * The `flat/` half must be arrays and the bare half eslintrc objects. Getting either backwards is the break this
   * whole file exists to catch: a consumer spreading an object into a flat config array gets a TypeError with the
   * plugin's name nowhere in it, and one spreading an array into an eslintrc `extends` gets nothing at all.
   */
  for (const [presetName, preset] of Object.entries(shape.configs)) {
    if (presetName.startsWith('flat/')) {
      assert.ok(Array.isArray(preset), `${label}: configs['${presetName}'] is not an array`);
      assert.ok(preset.length > 0, `${label}: configs['${presetName}'] is empty`);
      continue;
    }

    assert.ok(!Array.isArray(preset), `${label}: configs.${presetName} is an array, not eslintrc`);
    assert.deepEqual(preset.plugins, ['@linteljs'], `${label}: configs.${presetName} names no plugin`);
    assert.ok(
      Object.keys(preset.rules).length > 0,
      `${label}: configs.${presetName} enables nothing`,
    );
  }
}

assert.deepEqual(
  Object.keys(cjsNamespace.rules).sort(),
  Object.keys(esmDefault.rules).sort(),
  'ESM and CJS entry points expose different rule sets',
);

// A `sourceMappingURL` pointing at a file the tarball does not contain is a
// dead link in every consumer's editor. Cheap to leave behind, cheap to catch.
const distDir = join(pkgDir, 'dist');

for (const file of readdirSync(distDir)) {
  if (file.endsWith('.map')) {
    continue;
  }

  const contents = readFileSync(join(distDir, file), 'utf8');
  const reference = /sourceMappingURL=(\S+)/.exec(contents);

  if (reference?.[1]) {
    assert.ok(
      existsSync(join(distDir, reference[1])),
      `${file} points at ${reference[1]}, which is not in the package`,
    );
  }
}

console.log('  ✓ no dangling sourcemap references');

/**
 * `importHelpers` is on, so tsc would emit `require('tslib')` into anything it compiled; the bundler inlines its
 * own helpers instead, the only reason tslib can stay a devDependency. If it reaches dist, the package has grown
 * a runtime dependency and the zero-dependency promise is broken.
 */
for (const file of readdirSync(distDir)) {
  assert.ok(
    !readFileSync(join(distDir, file), 'utf8').includes('tslib'),
    `${file} references tslib, which is not a runtime dependency of this package`,
  );
}

console.log('  ✓ no runtime dependency leaked into dist');

/**
 * The `engines.node` floor is `>=12.0.0`, and a bundler cannot downlevel a *builtin*: it rewrites `?.` into
 * something Node 12 parses, then leaves `array.at(-1)` exactly as written, where it is a TypeError on the first
 * call. Every entry below postdates Node 12, so any of them in the bundle means the declared floor is a lie.
 * `compatMatrix.js` cannot catch this: it runs every ESLint major on whatever Node invoked it, the modern one.
 */
const POST_NODE_12 = [
  ['.at(', 16.6],
  ['.findLast(', 18],
  ['.findLastIndex(', 18],
  ['.toSorted(', 20],
  ['.toReversed(', 20],
  ['.toSpliced(', 20],
  ['Object.hasOwn', 16.9],
  ['structuredClone', 17],
  ['.replaceAll(', 15],
  ['Promise.any', 15],
  ['AggregateError', 15],
  ['WeakRef', 14.6],
];

for (const file of readdirSync(distDir)) {
  if (!file.endsWith('.js') && !file.endsWith('.mjs')) {
    continue;
  }

  const contents = readFileSync(join(distDir, file), 'utf8');

  for (const [api, since] of POST_NODE_12) {
    assert.ok(
      !contents.includes(api),
      `${file} uses ${api}, which needs Node ${String(since)}, above the declared floor of 12`,
    );
  }
}

console.log('  \u2713 no API newer than the declared Node floor');

/**
 * One doc per rule, at the path every version through 1.0.3 published. The move to a workspace
 * put this text at `src/rules/<id>/README.md`, which `files` does not pack, so the eleven files a
 * published path points at went missing from the tarball while every test stayed green.
 */
const packedDocs = readdirSync(join(pkgDir, 'docs', 'rules')).sort();

assert.deepEqual(
  packedDocs,
  Object.keys(esmDefault.rules).sort().map((id) => {
    return `${id}.md`;
  }),
  'docs/rules does not carry exactly one file per published rule',
);

// A link the flattening broke rather than rewrote. `../other-rule` resolved to a rule directory
// in the repo and resolves to nothing here.
for (const doc of packedDocs) {
  const text = readFileSync(join(pkgDir, 'docs', 'rules', doc), 'utf8');

  assert.doesNotMatch(text, /]\(\.\.\//, `${doc} still links out of the rules directory`);
}

console.log(`  ✓ ${String(packedDocs.length)} rule docs packed at the published path`);

rmSync(smokeDir, {
  recursive: true,
  force: true,
});
console.log('✓ packed artifact smoke test passed');
