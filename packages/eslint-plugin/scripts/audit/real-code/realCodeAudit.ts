/**
 * Runs every fixer over real third-party code, since the unit suite and mutation gate only know the corpus we wrote.
 * Each fix must parse, converge, and keep every token, comment, comment anchor and line ending; nothing is written
 * back. Report-only rules and arrow conversions are judged against shapes read off the AST, and each file's fix
 * time is recorded so a superlinear rule shows up. `--options` repeats the checks under every `meta.schema` option.
 *
 * Usage: tsx scripts/audit/real-code/realCodeAudit.ts [dir...] [--rule <id>] [--max-files <n>] [--options]
 */
import process from 'node:process';
import { parseArgs } from 'node:util';

import { Linter } from 'eslint';

import { logError } from '../../../../create/templates/project/scripts/utils/loggerUtils.ts';
import { filesUnder, sourcesFrom } from '../utils/corpusUtils.ts';
import { RULE_IDS } from '../utils/lintUtils.ts';

import { runFixPass } from './utils/fixPassUtils.ts';
import { emptyCounts } from './utils/fixUtils.ts';
import { runOptionSweep } from './utils/optionSweepUtils.ts';

import type { AuditContext } from './types.ts';

// A sweep pays for the corpus once per configuration, so it samples.
const DEFAULT_OPTION_FILES = 2000;

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'rule': { type: 'string' },
    'max-files': { type: 'string' },
    'options': {
      type: 'boolean',
      default: false,
    },
  },
});

if (flags.rule !== undefined && !RULE_IDS.includes(flags.rule)) {
  logError(`unknown rule: ${flags.rule}\nknown: ${RULE_IDS.join(', ')}`);
  process.exit(2);
}

const defaultMaxFiles = flags.options ? DEFAULT_OPTION_FILES : Infinity;
const maxFiles = flags['max-files'] === undefined ? defaultMaxFiles : Number(flags['max-files']);
const sources = sourcesFrom(positionals);

if (sources.length === 0) {
  logError('no source directories found');
  process.exit(2);
}

// A prefix for the fix pass. The sweep takes every nth, since a prefix of `node_modules` holds no React to sort.
const sampled = (): string[] => {
  const found = sources
    .flatMap((dir) => {
      return [...filesUnder(dir)];
    });
  const stride = Math.ceil(found.length / maxFiles);

  return found
    .filter((_, index) => {
      return index % stride === 0;
    });
};

const prefix = (): string[] => {
  return sources
    .values()
    .flatMap(filesUnder)
    .take(maxFiles)
    .toArray();
};

const context: AuditContext = {
  activeRules: flags.rule === undefined ? RULE_IDS : [flags.rule],
  auditCounts: new Map(),
  auditVolume: [],
  configCache: new Map(),
  counts: {
    js: emptyCounts(),
    ts: emptyCounts(),
  },
  files: flags.options ? sampled() : prefix(),
  findings: [],
  fixTimes: [],
  linter: new Linter(),
  options: {},
  seen: new Set(),
  sources,
  timings: [],
};

if ((flags.options ? runOptionSweep(context) : runFixPass(context)) > 0) {
  process.exitCode = 1;
}
