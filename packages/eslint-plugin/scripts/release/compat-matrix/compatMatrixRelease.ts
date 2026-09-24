/**
 * Runs the packed plugin against every ESLint major `peerDependencies` claims, since the suite runs one. Each major
 * gets its own install and the config format it reads: `.eslintrc.json` on 5 to 8, flat config on 9 and 10, so both
 * halves of `configs` meet a real consumer. Every major must then emit byte-identical fixed text. Network and
 * minutes, so it is not in `pnpm check`; run it before a release.
 *
 * Usage: node scripts/release/compat-matrix/compatMatrixRelease.ts
 */
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process, { execPath } from 'node:process';
import { promisify } from 'node:util';

import { log, logError } from '../../../../../scripts/utils/loggerUtils.ts';
import { packTarball } from '../../../../../scripts/utils/processUtils.ts';
import {
  fatalOf,
  lintResultOf,
  ruleIdsOf,
} from '../utils/eslintOutputUtils.ts';

import {
  EXPECTED,
  FIXTURE,
  flatConfig,
  legacyConfig,
  MAJORS,
  TS_EXPECTED,
  TS_FIXTURE,
  TS_TOOLING,
  tsFlatConfig,
  tsLegacyConfig,
} from './constants.ts';

import type { Major } from './constants.ts';

interface Outcome {
  failures: string[];
  fixes: [string | undefined, string | undefined];
  line: string;
}

const execFileAsync = promisify(execFile);
const pkgDir = resolve(import.meta.dirname, '../../..');
const matrixDir = join(pkgDir, '.compat');

const expectedFor = (typescript: boolean): string[] => {
  return typescript ? TS_EXPECTED : EXPECTED;
};

// Flat config is the default from 9, and the only format 10 reads.
const isFlat = (major: Major): boolean => {
  return major >= 9;
};

const configName = (major: Major, typescript: boolean): string => {
  if (isFlat(major)) {
    return typescript ? 'ts.config.mjs' : 'eslint.config.mjs';
  }

  return typescript ? '.eslintrc.ts.json' : '.eslintrc.json';
};

const prepare = async (major: Major, tarball: string): Promise<string> => {
  const dir = join(matrixDir, `eslint-${String(major)}`);

  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: `compat-${String(major)}`,
    private: true,
    type: isFlat(major) ? 'module' : 'commonjs',
  }, null, 2));
  writeFileSync(join(dir, 'fixture.js'), FIXTURE);
  writeFileSync(join(dir, 'fixture.ts'), TS_FIXTURE);
  writeFileSync(join(dir, configName(major, false)), isFlat(major) ? flatConfig : legacyConfig);
  writeFileSync(join(dir, configName(major, true)), isFlat(major) ? tsFlatConfig : tsLegacyConfig);

  // The 2019 parser's peers do not name this old ESLint on the nose; the pairing in TS_TOOLING is the check.
  await execFileAsync('npm', [
    'install',
    `eslint@${String(major)}`,
    tarball,
    ...TS_TOOLING[major],
    '--no-audit',
    '--no-fund',
    '--silent',
    '--legacy-peer-deps',
  ], { cwd: dir });

  return dir;
};

const lint = async (major: Major, dir: string, fix: boolean, typescript: boolean): Promise<[string[], string]> => {
  const bin = join(dir, 'node_modules', 'eslint', 'bin', 'eslint.js');
  const config = isFlat(major)
    ? [bin, '--no-config-lookup', '-c', configName(major, typescript)]
    : [bin, '--no-eslintrc', '-c', configName(major, typescript), '--ext', '.ts,.js'];
  const result = await lintResultOf(
    [...config, ...(fix ? ['--fix-dry-run'] : []), '-f', 'json', typescript ? 'fixture.ts' : 'fixture.js'],
    dir,
  );
  const fatal = fatalOf(result);

  if (fatal.length > 0) {
    throw new Error(`${typescript ? 'typescript ' : ''}fatal ${JSON.stringify(fatal)}`);
  }

  return [
    (fix ? [] : expectedFor(typescript)).filter((id) => {
      return !ruleIdsOf(result).includes(id);
    }),
    result.output ?? '',
  ];
};

// Each major is its own install and its own processes, so all six run at once.
const check = async (major: Major, tarball: string): Promise<Outcome> => {
  try {
    const dir = await prepare(major, tarball);
    const { stdout } = await execFileAsync(execPath, ['-p', 'require("eslint/package.json").version'], { cwd: dir });
    const installed = stdout.trim();
    const [[missing], [tsMissing]] = await Promise.all([lint(major, dir, false, false), lint(major, dir, false, true)]);
    const absent = [...missing, ...tsMissing];

    if (absent.length > 0) {
      return {
        failures: [`eslint ${installed}: no report from ${absent.join(', ')}`],
        fixes: [undefined, undefined],
        line: `eslint ${installed}: missing ${absent.join(', ')}`,
      };
    }

    // The fixed text, not just the report: a rule rewriting differently on one major is the worse defect.
    const [[, fixed], [, tsFixed]] = await Promise.all([lint(major, dir, true, false), lint(major, dir, true, true)]);

    return {
      failures: [],
      fixes: [fixed, tsFixed],
      line: `eslint ${installed}: all ${String(EXPECTED.length + TS_EXPECTED.length)} rules reported, both languages`,
    };
  }
  catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    return {
      failures: [`eslint ${String(major)}: ${detail}`],
      fixes: [undefined, undefined],
      line: `eslint ${String(major)}: ${detail.split('\n', 1).join('')}`,
    };
  }
};

// The packed tarball, since an entry missing from `files` or an `exports` map resolving only here is what a consumer
// meets and a matrix over source cannot.
const tarball = packTarball(pkgDir, matrixDir);
const outcomes = await Promise.all(MAJORS.map(async (major) => {
  return await check(major, tarball);
}));
const failures = outcomes.flatMap((outcome) => {
  return outcome.failures;
});

// Byte-identical to the newest major, which the unit suite pins.
for (const [slot, label] of [[0, 'javascript'], [1, 'typescript']] as const) {
  const reference = outcomes.at(-1)?.fixes[slot];

  for (const [index, outcome] of outcomes.entries()) {
    if (outcome.failures.length === 0 && outcome.fixes[slot] !== reference) {
      failures.push(`eslint ${String(MAJORS[index])}: ${label} fixer output differs from the newest major`);
    }
  }
}

log(outcomes.map(({ failures: failed, line }) => {
  return `  ${failed.length === 0 ? 'ok' : 'FAILED'}  ${line}`;
}).join('\n'));

if (failures.length > 0) {
  logError(`${String(failures.length)} failure(s) across ${String(MAJORS.length)} majors:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

log(`every rule reports on all ${String(MAJORS.length)} declared majors, with byte-identical fixed output`);
