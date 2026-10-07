// Every major must emit byte-identical fixed text. Network and minutes, so not in `pnpm check`.
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process, { execPath } from 'node:process';
import { promisify } from 'node:util';

import { packTarball } from '../../../../../scripts/utils/processUtils.ts';
import { log, logError } from '../../../../create/templates/project/scripts/utils/loggerUtils.ts';
import {
  fatalOf,
  type LintResult,
  lintResultOf,
  ruleIdsOf,
} from '../utils/eslintOutputUtils.ts';

import {
  ESLINT_VERSIONS,
  EXPECTED,
  FIRST_FLAT_MAJOR,
  FIXTURE,
  flatConfig,
  legacyConfig,
  type Major,
  MAJORS,
  TS_EXPECTED,
  TS_FIXTURE,
  TS_TOOLING,
} from './constants.ts';
import { tsFlatConfig, tsLegacyConfig } from './utils/configUtils.ts';

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

const isFlat = (major: Major): boolean => {
  return major >= FIRST_FLAT_MAJOR;
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
  const configPath = join(dir, configName(major, false));

  writeFileSync(configPath, isFlat(major) ? flatConfig : legacyConfig);

  const tsConfigPath = join(dir, configName(major, true));

  writeFileSync(tsConfigPath, isFlat(major) ? tsFlatConfig() : tsLegacyConfig());

  // `--legacy-peer-deps`: the parser's peer range starts above 8.40; the TS_TOOLING pairing is the check.
  await execFileAsync('npm', [
    'install',
    `eslint@${ESLINT_VERSIONS[major]}`,
    tarball,
    ...TS_TOOLING[major],
    '--no-audit',
    '--no-fund',
    '--silent',
    '--legacy-peer-deps',
  ], { cwd: dir });

  return dir;
};

const lintArgs = (major: Major, dir: string, fix: boolean, typescript: boolean): string[] => {
  const bin = join(dir, 'node_modules', 'eslint', 'bin', 'eslint.js');
  const config = isFlat(major)
    ? [
        bin,
        '--no-config-lookup',
        '-c',
        configName(major, typescript),
      ]
    : [
        bin,
        '--no-eslintrc',
        '-c',
        configName(major, typescript),
        '--ext',
        '.ts,.js',
      ];
  const args = [
    ...config,
    ...(fix ? ['--fix-dry-run'] : []),
    '-f',
    'json',
    typescript ? 'fixture.ts' : 'fixture.js',
  ];

  return args;
};

// A fix pass is read for its output alone.
const missingFrom = (result: LintResult, fix: boolean, typescript: boolean): string[] => {
  const ids = ruleIdsOf(result);

  return (fix ? [] : expectedFor(typescript))
    .filter((id) => {
      return !ids.includes(id);
    });
};

const lint = async (major: Major, dir: string, fix: boolean, typescript: boolean): Promise<[string[], string]> => {
  const args = lintArgs(major, dir, fix, typescript);
  const result = await lintResultOf(args, dir);
  const fatal = fatalOf(result);

  if (fatal.length > 0) {
    throw new Error(`${typescript ? 'typescript ' : ''}fatal ${JSON.stringify(fatal)}`);
  }

  const verdict: [string[], string] = [missingFrom(result, fix, typescript), result.output ?? ''];

  return verdict;
};

// Each major is its own install, so all of them run at once.
const check = async (major: Major, tarball: string): Promise<Outcome> => {
  try {
    const dir = await prepare(major, tarball);
    const { stdout } = await execFileAsync(execPath, ['-p', 'require("eslint/package.json").version'], { cwd: dir });
    const installed = stdout.trim();
    const [[missing], [tsMissing]] = await Promise.all([lint(major, dir, false, false), lint(major, dir, false, true)]);
    const absent = [...missing, ...tsMissing];

    if (absent.length > 0) {
      const unreported: Outcome = {
        failures: [`eslint ${installed}: no report from ${absent.join(', ')}`],
        fixes: [undefined, undefined],
        line: `eslint ${installed}: missing ${absent.join(', ')}`,
      };

      return unreported;
    }

    // The fixed text, not just the report: a rule rewriting differently on one major is the worse defect.
    const [[, fixed], [, tsFixed]] = await Promise.all([lint(major, dir, true, false), lint(major, dir, true, true)]);

    const passed: Outcome = {
      failures: [],
      fixes: [fixed, tsFixed],
      line: `eslint ${installed}: all ${String(EXPECTED.length + TS_EXPECTED.length)} rules reported, both languages`,
    };

    return passed;
  }
  catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    const broken: Outcome = {
      failures: [`eslint ${String(major)}: ${detail}`],
      fixes: [undefined, undefined],
      line: `eslint ${String(major)}: ${detail
        .split('\n', 1)
        .join('')}`,
    };

    return broken;
  }
};

// The packed tarball: a missing `files` entry is what a consumer meets and a matrix over source cannot.
const tarball = packTarball(pkgDir, matrixDir);
const checks = MAJORS
  .map(async (major) => {
    return await check(major, tarball);
  });

const outcomes = await Promise.all(checks);
const failures = outcomes
  .flatMap((outcome) => {
    return outcome.failures;
  });

const languages = [[0, 'javascript'], [1, 'typescript']] as const;

for (const [slot, label] of languages) {
  const reference = outcomes.at(-1)?.fixes[slot];

  for (const [index, outcome] of outcomes.entries()) {
    if (outcome.failures.length === 0 && outcome.fixes[slot] !== reference) {
      failures.push(`eslint ${String(MAJORS[index])}: ${label} fixer output differs from the newest major`);
    }
  }
}

const summary = outcomes
  .map(({ failures: failed, line }) => {
    return `  ${failed.length === 0 ? 'ok' : 'FAILED'}  ${line}`;
  })
  .join('\n');

log(summary);

if (failures.length > 0) {
  logError(`${String(failures.length)} failure(s) across ${String(MAJORS.length)} majors:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

log(`every rule reports on all ${String(MAJORS.length)} declared majors, with byte-identical fixed output`);
