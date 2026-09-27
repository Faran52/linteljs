import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

import {
  nameFor,
  parseOrNull,
  type Program,
} from '../../utils/astUtils.ts';
import { isFirstSighting, skipReason } from '../../utils/corpusUtils.ts';
import { configFor, moduleOf } from '../../utils/lintUtils.ts';

import { AUDIT_RULES, hoistedProbe } from './reportShapeUtils.ts';

import type { Linter } from 'eslint';
import type { AuditContext, Counts } from '../types.ts';

export const pluginConfig = (context: AuditContext, names: string[]): Linter.Config[] => {
  const key = `${names.join(',')}|${JSON.stringify(context.options)}`;
  const cached = context.configCache.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const config = configFor(
    Object.fromEntries(names
      .map((name) => {
        return [name, moduleOf(name)];
      })),
    Object.fromEntries(names
      .map((name) => {
        const options = context.options[name];
        const entry: Linter.RuleEntry = options === undefined ? 'error' : ['error', options];

        return [`@linteljs/${name}`, entry];
      })),
    // Files disable rules this config never loads, and ESLint 9+ deletes such a comment when left on.
    { reportUnusedDisableDirectives: 'off' },
  );

  context.configCache.set(key, config);

  return config;
};

export const auditConfig = (context: AuditContext): Linter.Config[] => {
  return pluginConfig(context, AUDIT_RULES)
    .map((entry) => {
      return {
        ...entry,
        plugins: {
          ...entry.plugins,
          probe: { rules: { hoisted: hoistedProbe } },
        },
        rules: {
          ...entry.rules,
          'probe/hoisted': 'error' as const,
        },
      };
    });
};

export const fix = (context: AuditContext, source: string, name: string, names: string[]): string => {
  const started = performance.now();
  const { output } = context.linter.verifyAndFix(source, pluginConfig(context, names), name);

  if (context.fixTimes.length === 0) {
    context.fixTimes.push(performance.now() - started);
  }

  return output;
};

export const parsedFix = (
  context: AuditContext,
  source: string,
  name: string,
  names: string[],
): Program | undefined => {
  if (names.length === 0) {
    return undefined;
  }

  const fixed = fix(context, source, name, names);

  return fixed === source ? undefined : parseOrNull(fixed, name) ?? undefined;
};

export const subsetOf = (candidates: string[], names: string[]): string[] => {
  return candidates
    .filter((rule) => {
      return names.includes(rule);
    });
};

export const emptyCounts = (): Counts => {
  return {
    changed: 0,
    compiled: 0,
    duplicate: 0,
    minified: 0,
    oversized: 0,
    scanned: 0,
    unparsed: 0,
  };
};

export const load = (context: AuditContext, file: string, bucket: Counts): [string, string, Program] | undefined => {
  const source = readFileSync(file, 'utf8');
  const skipped = skipReason(source);

  if (skipped !== undefined) {
    bucket[skipped] += 1;

    return undefined;
  }

  if (!isFirstSighting(context.seen, source)) {
    bucket.duplicate += 1;

    return undefined;
  }

  const name = nameFor(file, source);
  const ast = parseOrNull(source, name);

  if (!ast) {
    bucket.unparsed += 1;

    return undefined;
  }

  return [source, name, ast];
};
