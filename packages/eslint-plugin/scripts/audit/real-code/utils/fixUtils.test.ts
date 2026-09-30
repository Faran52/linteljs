import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  auditContext,
  plantRules,
  textRule,
} from '@mocks/auditContext.ts';

import {
  auditConfig,
  emptyCounts,
  fix,
  load,
  parsedFix,
  pluginConfig,
  subsetOf,
} from './fixUtils.ts';

const LONG_UNION = 'type Alpha = { first: string } | string;\n';

describe('pluginConfig', () => {
  it('caches by rule list and the options in force', () => {
    const context = auditContext();
    const first = pluginConfig(context, ['union-newline']);

    expect(pluginConfig(context, ['union-newline'])).toBe(first);

    context.options = { 'union-newline': { maxGenericMembers: 1 } };

    const optioned = pluginConfig(context, ['union-newline']);

    expect(optioned).not.toBe(first);
    expect(optioned[0]?.rules).toStrictEqual({ '@linteljs/union-newline': ['error', { maxGenericMembers: 1 }] });
    expect(first[0]?.rules).toStrictEqual({ '@linteljs/union-newline': 'error' });
  });
});

describe('auditConfig', () => {
  it('adds the hoisting probe to every entry', () => {
    const config = auditConfig(auditContext());

    expect(config.length).toBeGreaterThan(0);

    const allProbed = config
      .every((entry) => {
        return entry.rules?.['probe/hoisted'] === 'error' && entry.plugins?.['probe'] !== undefined;
      });

    expect(allProbed).toBe(true);
  });
});

describe('fix', () => {
  it('records only the first fix time of a file', () => {
    const context = auditContext();
    const fixed = fix(context, LONG_UNION, 'file.ts', ['union-newline']);

    fix(context, LONG_UNION, 'file.ts', ['union-newline']);

    expect(fixed).not.toBe(LONG_UNION);
    expect(context.fixTimes).toHaveLength(1);
  });
});

describe('parsedFix', () => {
  it('answers nothing for no rules, an unchanged source or unparseable output', () => {
    const context = auditContext();

    expect(parsedFix(context, LONG_UNION, 'file.ts', [])).toBeUndefined();
    expect(parsedFix(context, 'const a = 1;\n', 'file.ts', ['union-newline'])).toBeUndefined();

    plantRules(context, {
      'union-newline': textRule((text) => {
        return text.replace('|', '');
      }),
    });

    expect(parsedFix(context, LONG_UNION, 'file.ts', ['union-newline'])).toBeUndefined();
  });

  it('answers the parsed output of a fix that changed the source', () => {
    expect(parsedFix(auditContext(), LONG_UNION, 'file.ts', ['union-newline'])?.type).toBe('Program');
  });
});

describe('subsetOf', () => {
  it('keeps the candidates the run names, in candidate order', () => {
    expect(subsetOf([
      'a',
      'b',
      'c',
    ], ['c', 'a'])).toStrictEqual(['a', 'c']);
  });
});

describe('load', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fix-utils-'));
  const write = (name: string, text: string): string => {
    const file = join(dir, name);

    writeFileSync(file, text);

    return file;
  };

  it('counts a skipped, a duplicate and an unparsed file, and loads the rest', () => {
    const context = auditContext();
    const bucket = emptyCounts();
    const good = write('good.ts', 'const a = 1;\n');

    expect(load(context, write('compiled.js', 'x;\n//# sourceMappingURL=x.map\n'), bucket)).toBeUndefined();
    expect(load(context, write('broken.ts', 'const = ;\n'), bucket)).toBeUndefined();
    expect(load(context, good, bucket)?.slice(0, 2)).toStrictEqual(['const a = 1;\n', 'file.ts']);
    expect(load(context, write('copy.ts', 'const a = 1;\n'), bucket)).toBeUndefined();
    expect(bucket).toStrictEqual({
      ...emptyCounts(),
      compiled: 1,
      duplicate: 1,
      unparsed: 1,
    });
  });
});
