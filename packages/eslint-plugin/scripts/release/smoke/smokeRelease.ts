// A missing `files` entry, a broken `exports` map or a throwing CJS build passes every unit test.
import assert from 'node:assert/strict';
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

import { unpackTarball } from '../../../../../scripts/utils/processUtils.ts';
import { log } from '../../../../create/templates/project/scripts/utils/loggerUtils.ts';
import {
  fatalOf,
  lintResultOf,
  ruleIdsOf,
} from '../utils/eslintOutputUtils.ts';

interface EslintrcOverride {
  rules?: object;
}

// Written out rather than imported: this reads the artifact as a stranger.
interface EslintrcPreset {
  plugins?: string[];
  rules?: object;
  overrides?: EslintrcOverride[];
}

interface PluginMeta {
  name?: string;
  version?: string;
}

interface PluginShape {
  rules: object;
  configs: Record<string, EslintrcPreset | unknown[]>;
  meta?: PluginMeta;
}

const root = resolve(import.meta.dirname, '../../..');
const smokeDir = join(root, '.smoke');

// A bare sort() orders by UTF-16 code unit, so the lists compared below move on a locale change.
const alphabetically = (left: string, right: string): number => {
  return left.localeCompare(right);
};

const isPluginShape = (value: unknown): value is PluginShape => {
  return typeof value === 'object'
    && value !== null
    && 'rules' in value
    && Boolean(value.rules)
    && 'configs' in value
    && Boolean(value.configs);
};

const defaultExportOf = async (href: string): Promise<unknown> => {
  const loaded: unknown = await import(href);

  return typeof loaded === 'object' && loaded !== null && 'default' in loaded ? loaded.default : undefined;
};

log('packing and extracting the tarball');

const pkgDir = unpackTarball(root, smokeDir);
const distDir = join(pkgDir, 'dist');

// Several rules at once, so a silently unregistered rule shows up as a missing message.
const fixture = [
  "import { alpha, bravo, charlie } from 'mod';",
  '',
  'function greet(name) { return alpha + bravo + charlie + name; }',
  '',
  'export { alpha, bravo, charlie };',
  '',
].join('\n');

const expectedRuleIds = [
  '@linteljs/import-newlines',
  '@linteljs/prefer-arrow-functions',
  '@linteljs/export-specifier-newline',
];

// Written out, so a rename fails here.
const expectedPresetNames = [
  'all',
  'flat/all',
  'flat/recommended',
  'recommended',
];

// The configs below name rules by hand, so they would pass with every preset key misspelled.
const esmPresetConfig = (pluginPath: string): string => {
  return [
    `import linteljs from ${JSON.stringify(pluginPath)};`,
    '',
    'export default [',
    '  ...linteljs.configs[\'flat/recommended\'],',
    '];',
    '',
  ].join('\n');
};

const esmConfig = (pluginPath: string): string => {
  return [
    `import linteljs from ${JSON.stringify(pluginPath)};`,
    '',
    'export default [',
    '  { plugins: { \'@linteljs\': linteljs }, rules: {',
    ...expectedRuleIds
      .map((id) => {
        return `    ${JSON.stringify(id)}: 'error',`;
      }),
    '  } },',
    '];',
    '',
  ].join('\n');
};

const cjsConfig = (pluginPath: string): string => {
  return [
    `const linteljs = require(${JSON.stringify(pluginPath)});`,
    '',
    'module.exports = [',
    '  { plugins: { \'@linteljs\': linteljs }, rules: {',
    ...expectedRuleIds
      .map((id) => {
        return `    ${JSON.stringify(id)}: 'error',`;
      }),
    '  } },',
    '];',
    '',
  ].join('\n');
};

const eslintBin = join(root, 'node_modules', 'eslint', 'bin', 'eslint.js');

const checkFlavour = async (name: string, configFile: string, configSource: string): Promise<void> => {
  const dir = join(smokeDir, name);

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, configFile), configSource);
  writeFileSync(join(dir, 'fixture.js'), fixture);

  const args = [
    eslintBin,
    '--no-config-lookup',
    '-c',
    configFile,
    '-f',
    'json',
    'fixture.js',
  ];
  const result = await lintResultOf(args, dir);
  const reported = new Set(ruleIdsOf(result));

  assert.deepEqual(fatalOf(result), [], `${name}: fatal parse error`);

  for (const ruleId of expectedRuleIds) {
    assert.ok(reported.has(ruleId), `${name}: expected ${ruleId} to report, got ${[...reported].join(', ')}`);
  }

  log(`${name} entry loaded, ${String(reported.size)}/${String(expectedRuleIds.length)} expected rule ids fired`);
};

const esmEntry = pathToFileURL(join(distDir, 'index.mjs')).href;

await Promise.all([
  checkFlavour('esm', 'eslint.config.mjs', esmConfig(esmEntry)),
  checkFlavour('cjs', 'eslint.config.cjs', cjsConfig(join(distDir, 'index.js'))),
  checkFlavour('esm-preset', 'eslint.config.mjs', esmPresetConfig(esmEntry)),
]);

// A `.cjs` flat config gets the namespace from `require`, an ESM one the default: both must be a plugin.
const cjsNamespace = await defaultExportOf(pathToFileURL(join(distDir, 'index.js')).href);
const esmDefault = await defaultExportOf(esmEntry);

assert.ok(isPluginShape(cjsNamespace), 'cjs require(): no `rules` and `configs` on the default export');
assert.ok(isPluginShape(esmDefault), 'esm default: no `rules` and `configs` on the default export');

const entries: [string, PluginShape][] = [['cjs require()', cjsNamespace], ['esm default', esmDefault]];

for (const [label, shape] of entries) {
  assert.ok(shape.meta?.name, `${label}: no \`meta.name\``);
  assert.ok(shape.meta.version, `${label}: no \`meta.version\``);

  const configNames = Object.keys(shape.configs)
    .sort(alphabetically);

  assert.deepEqual(
    configNames,
    expectedPresetNames,
    `${label}: published preset names changed`,
  );

  // Backwards either way breaks a consumer with this plugin's name nowhere in the error.
  for (const [presetName, preset] of Object.entries(shape.configs)) {
    if (presetName.startsWith('flat/')) {
      assert.ok(Array.isArray(preset), `${label}: configs['${presetName}'] is not an array`);
      assert.ok(preset.length > 0, `${label}: configs['${presetName}'] is empty`);
      continue;
    }

    assert.ok(!Array.isArray(preset), `${label}: configs.${presetName} is an array, not eslintrc`);
    assert.deepEqual(preset.plugins, ['@linteljs'], `${label}: configs.${presetName} names no plugin`);

    const enabled = Object.keys(preset.rules ?? {}).length
      + (preset.overrides ?? [])
        .reduce((total: number, override) => {
          return total + Object.keys(override.rules ?? {}).length;
        }, 0);

    assert.ok(enabled > 0, `${label}: configs.${presetName} enables nothing`);
  }
}

const cjsRules = Object.keys(cjsNamespace.rules)
  .sort(alphabetically);

const esmRules = Object.keys(esmDefault.rules)
  .sort(alphabetically);

assert.deepEqual(
  cjsRules,
  esmRules,
  'ESM and CJS entry points expose different rule sets',
);

// The `engines.node` floor is 18, where a bundler downlevels new syntax but leaves `array.toSorted()`.
const POST_NODE_18: [string, number][] = [
  ['.toSorted(', 20],
  ['.toReversed(', 20],
  ['.toSpliced(', 20],
];

for (const file of readdirSync(distDir)) {
  const contents = readFileSync(join(distDir, file), 'utf8');
  const reference = /sourceMappingURL=(\S+)/.exec(contents)?.[1];

  if (reference !== undefined && !file.endsWith('.map')) {
    assert.ok(existsSync(join(distDir, reference)), `${file} points at ${reference}, which is not in the package`);
  }

  assert.ok(!contents.includes('tslib'), `${file} references tslib, which is not a runtime dependency`);

  for (const [api, since] of file.endsWith('.js') || file.endsWith('.mjs') ? POST_NODE_18 : []) {
    assert.ok(!contents.includes(api), `${file} uses ${api}, which needs Node ${String(since)}, above the floor of 18`);
  }
}

log('no dangling sourcemap, no runtime dependency, no API newer than the declared Node floor');

// Every version has published this path, which the move into `src/rules/` once dropped.
const packedDocs = readdirSync(join(pkgDir, 'docs', 'rules'))
  .sort(alphabetically);

const ruleDocs = Object.keys(esmDefault.rules)
  .sort(alphabetically)
  .map((id) => {
    return `${id}.md`;
  });

assert.deepEqual(
  packedDocs,
  ruleDocs,
  'docs/rules does not carry exactly one file per published rule',
);

// `../other-rule` resolves to a rule directory in the repo and to nothing in the tarball.
for (const doc of packedDocs) {
  const text = readFileSync(join(pkgDir, 'docs', 'rules', doc), 'utf8');

  assert.doesNotMatch(text, /]\(\.\.\//, `${doc} still links out of the rules directory`);
}

log(`${String(packedDocs.length)} rule docs packed at the published path`);

rmSync(smokeDir, {
  recursive: true,
  force: true,
});
log('packed artifact smoke test passed');
