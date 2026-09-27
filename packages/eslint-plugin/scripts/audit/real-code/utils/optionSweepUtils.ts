import {
  log,
  logError,
  logWarn,
} from '../../../../../create/templates/project/scripts/utils/loggerUtils.ts';
import { messageOf } from '../../utils/corpusUtils.ts';
import { type Configuration, configurationsFor } from '../../utils/optionUtils.ts';

import { evaluate, narrow } from './attributionUtils.ts';
import { show } from './findingUtils.ts';
import { emptyCounts, load } from './fixUtils.ts';

import type { AuditContext } from '../types.ts';

interface SweepCounter {
  changed: number;
  configuration: Configuration;
  findings: number;
  scanned: number;
}

const sweep = (
  context: AuditContext,
  file: string,
  counters: SweepCounter[],
): number => {
  // The sweep reports no skip counts, so they land in a bucket nothing reads.
  const loaded = load(context, file, emptyCounts());

  if (loaded === undefined) {
    return 0;
  }

  const [source, name, ast] = loaded;
  let hits = 0;

  for (const counter of counters) {
    const { configuration } = counter;

    context.options = configuration.options;

    const result = evaluate(context, source, name, [configuration.rule], ast);

    counter.scanned += 1;
    counter.changed += result.changed ? 1 : 0;

    for (const finding of result.findings) {
      const [snippet, label] = narrow(context, source, result.fixed, name, finding);

      logError(`under ${configuration.label}`);
      show(file, finding, snippet, label);
      counter.findings += 1;
      hits += 1;
    }
  }

  context.options = {};

  return hits;
};

// Answers the number of findings, which the caller turns into the exit code.
export const runOptionSweep = (context: AuditContext): number => {
  const { files } = context;
  const configurations = context.activeRules.flatMap(configurationsFor);

  if (configurations.length === 0) {
    logWarn('no rule in this run declares an option, so there is nothing to sweep');

    return 0;
  }

  log([
    `${String(files.length)} files sampled, against ${String(configurations.length)} configurations read off `
    + 'meta.schema:',
    ...configurations
      .map(({ label }) => {
        return `    ${label}`;
      }),
  ].join('\n'));

  const counters = configurations
    .map((configuration): SweepCounter => {
      return {
        changed: 0,
        configuration,
        findings: 0,
        scanned: 0,
      };
    });
  let hits = 0;

  for (const [index, file] of files.entries()) {
    // A crash under a non-default option is the defect this sweep exists to find.
    try {
      hits += sweep(context, file, counters);
    }
    catch (error) {
      logError(`threw: ${file}\n  ${messageOf(error)}`);
      hits += 1;
    }

    if ((index + 1) % 250 === 0) {
      log(`${String(index + 1)}/${String(files.length)} files, ${String(hits)} findings`);
    }
  }

  log([
    'per configuration: files linted, files changed by the fixer, findings',
    ...counters
      .map(({
        changed,
        configuration,
        findings,
        scanned,
      }) => {
        return `  ${String(scanned).padStart(6)} ${String(changed).padStart(6)} `
          + `${String(findings).padStart(4)}  ${configuration.label}`;
      }),
  ].join('\n'));

  if (hits === 0) {
    log('every fix parsed, converged, and kept every token, line ending and comment under every configuration');

    return 0;
  }

  logError(`${String(hits)} findings`);

  return hits;
};
