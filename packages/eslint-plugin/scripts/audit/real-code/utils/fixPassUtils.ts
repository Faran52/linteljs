import { extname } from 'node:path';

import { countBy, orderBy } from 'es-toolkit';

import { log, logError } from '../../../../../create/templates/project/scripts/utils/loggerUtils.ts';
import { messageOf } from '../../utils/corpusUtils.ts';

import {
  attribute,
  dominantRule,
  evaluate,
  narrow,
} from './attributionUtils.ts';
import { show } from './findingUtils.ts';
import { auditConfig, load } from './fixUtils.ts';
import {
  atReport,
  AUDIT_RULES,
  type Finding,
  judge,
  shapesOf,
} from './reportShapeUtils.ts';
import { showTiming } from './timingUtils.ts';

import type { Linter } from 'eslint';
import type { Program } from '../../utils/astUtils.ts';
import type {
  AuditContext,
  Flavour,
  Located,
} from '../types.ts';

interface AuditFinding extends Finding {
  line: number;
}

const around = (source: string, line: number): string => {
  return `${source
    .split('\n')
    .slice(Math.max(0, line - 3), line + 2)
    .join('\n')}\n`;
};

const flavourOf = (file: string): Flavour => {
  return ['.ts', '.tsx'].includes(extname(file)) ? 'ts' : 'js';
};

// A disable comment naming an unloaded rule arrives under that rule's id.
const audit = (
  context: AuditContext,
  config: Linter.Config[],
  file: string,
  source: string,
  ast: Program,
  name: string,
): AuditFinding[] => {
  const reports = context.linter.verify(source, config, name);

  if (reports
    .some((report) => {
      return report.fatal === true;
    })) {
    return [];
  }

  const hoisted = reports
    .filter((report) => {
      return report.ruleId === 'probe/hoisted';
    })
    .map(atReport);

  const probed = new Set(hoisted);
  const own = reports
    .flatMap((report) => {
      const { ruleId } = report;

      return ruleId?.startsWith('@linteljs/') === true
        ? [{
            report,
            ruleId,
          }]
        : [];
    });
  const shapes = shapesOf(ast);

  for (const { ruleId } of own) {
    context.auditCounts.set(ruleId, (context.auditCounts.get(ruleId) ?? 0) + 1);
  }

  if (own.length > 0) {
    context.auditVolume.push([own.length, file]);
  }

  return own
    .flatMap(({ report }) => {
      const finding = judge(report, shapes, probed);

      return finding === undefined
        ? []
        : [{
            ...finding,
            line: report.line,
          }];
    });
};

const check = (context: AuditContext, config: Linter.Config[], file: string): void => {
  const flavour = flavourOf(file);
  const bucket = context.counts[flavour];
  const loaded = load(context, file, bucket);

  if (loaded === undefined) {
    return;
  }

  const [
    source,
    name,
    ast,
  ] = loaded;

  bucket.scanned += 1;
  context.fixTimes.length = 0;

  for (const finding of audit(context, config, file, source, ast, name)) {
    context.findings.push({
      file,
      flavour,
      ...finding,
    });

    show(file, finding, around(source, finding.line), `reported at line ${String(finding.line)}`);
  }

  const result = evaluate(context, source, name, context.activeRules, ast);

  // Before the attribution below, which re-lints the file and would land in the sample as its cost.
  const [firstFixMs] = context.fixTimes;

  if (firstFixMs !== undefined) {
    context.timings.push({
      bytes: source.length,
      file,
      ms: firstFixMs,
    });
  }

  if (!result.changed) {
    return;
  }

  bucket.changed += 1;

  for (const finding of result.findings) {
    const culprits = finding.rules.length > 1 ? attribute(context, source, name, finding.rules, finding.category) : [];
    const named = {
      ...finding,
      rules: culprits.length > 0 ? culprits : finding.rules,
    };
    const [snippet, label] = narrow(context, source, result.fixed, name, named);

    context.findings.push({
      file,
      flavour,
      ...named,
    });

    show(file, named, snippet, label);
  }
};

const tally = (findings: Located[], keyOf: (finding: Located) => string): string[] => {
  return orderBy(Object.entries(countBy(findings, keyOf)), [1], ['desc'])
    .map(([key, count]) => {
      return `  ${String(count)}  ${key}`;
    });
};

export const runFixPass = (context: AuditContext): number => {
  const {
    activeRules,
    counts,
    files,
    findings,
    sources,
  } = context;
  const config = auditConfig(context);
  const typescript = files
    .filter((file) => {
      return flavourOf(file) === 'ts';
    }).length;

  log([
    `${String(files.length)} files (${String(typescript)} TypeScript, ${String(files.length - typescript)} `
    + 'JavaScript) under:',
    ...sources
      .map((dir) => {
        return `    ${dir}`;
      }),
    `rules: ${activeRules.join(', ')}`,
    `audit: ${AUDIT_RULES.join(', ')}`,
  ].join('\n'));

  const startedAt = Date.now();

  for (const [index, file] of files.entries()) {
    // One pathological file must not end the run.
    try {
      check(context, config, file);
    }
    catch (error) {
      const finding = {
        category: 'threw',
        rules: activeRules,
        detail: messageOf(error),
      };

      findings.push({
        file,
        flavour: flavourOf(file),
        ...finding,
      });

      show(file, finding, '', 'no snippet');
    }

    if ((index + 1) % 500 === 0) {
      log(`${String(index + 1)}/${String(files.length)} files, ${String(counts.ts.changed + counts.js.changed)} `
        + `fixed, ${String(findings.length)} findings`);
    }
  }

  const wallMs = Date.now() - startedAt;

  for (const [flavour, label] of [['ts', 'TypeScript'], ['js', 'JavaScript']] as const) {
    const bucket = counts[flavour];
    const hits = findings
      .filter((finding) => {
        return finding.flavour === flavour;
      }).length;

    log(`${label}: ${String(bucket.scanned)} files linted, ${String(bucket.changed)} changed by a fixer, `
      + `${String(hits)} findings\n  skipped: ${String(bucket.compiled)} compiled, ${String(bucket.minified)} `
      + `minified or bundled, ${String(bucket.oversized)} oversized, ${String(bucket.duplicate)} duplicates, `
      + `${String(bucket.unparsed)} the parser rejected`);
  }

  log([
    'reports across the corpus:',
    ...orderBy([...context.auditCounts], [1], ['desc'])
      .map(([ruleId, count]) => {
        return `  ${String(count).padStart(7)}  ${ruleId}`;
      }),
    'busiest files:',
    ...orderBy(context.auditVolume, [0], ['desc'])
      .slice(0, 5)
      .map(([count, file]) => {
        return `  ${String(count).padStart(7)}  ${file}`;
      }),
  ].join('\n'));

  showTiming(context.timings, wallMs, (file) => {
    return dominantRule(context, file);
  });

  if (findings.length === 0) {
    log('every fix parsed, converged, and kept every token, line ending and comment, each still written against '
      + 'the code it was written against; every conversion and report matched the shape its rule claims');

    return 0;
  }

  logError([
    `${String(findings.length)} findings`,
    ...tally(findings, (finding) => {
      return finding.category;
    }),
    'by rule:',
    ...tally(findings, (finding) => {
      return finding.rules.join(', ');
    }),
  ].join('\n'));

  return findings.length;
};
