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

    const actual = pluginConfig(context, ['union-newline']);
    expect(actual).toBe(first);

    context.options = { 'union-newline': { maxGenericMembers: 1 } };

    const optioned = pluginConfig(context, ['union-newline']);

    expect(optioned).not.toBe(first);
    const expected = { '@linteljs/union-newline': ['error', { maxGenericMembers: 1 }] };
    expect(optioned[0]?.rules).toStrictEqual(expected);
    const expected2 = { '@linteljs/union-newline': 'error' };
    expect(first[0]?.rules).toStrictEqual(expected2);
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

    const actual = parsedFix(context, LONG_UNION, 'file.ts', []);
    expect(actual).toBeUndefined();
    const actual2 = parsedFix(context, 'const a = 1;\n', 'file.ts', ['union-newline']);
    expect(actual2).toBeUndefined();

    plantRules(context, {
      'union-newline': textRule((text) => {
        return text.replace('|', '');
      }),
    });

    const actual3 = parsedFix(context, LONG_UNION, 'file.ts', ['union-newline']);
    expect(actual3).toBeUndefined();
  });

  it('answers the parsed output of a fix that changed the source', () => {
    const parsed = parsedFix(auditContext(), LONG_UNION, 'file.ts', ['union-newline']);

    expect(parsed?.type).toBe('Program');
  });
});

describe('subsetOf', () => {
  it('keeps the candidates the run names, in candidate order', () => {
    const subset = subsetOf([
      'a',
      'b',
      'c',
    ], ['c', 'a']);
    const expected = ['a', 'c'];
    expect(subset).toStrictEqual(expected);
  });
});

describe('load', () => {
  const prefix = join(tmpdir(), 'fix-utils-');
  const dir = mkdtempSync(prefix);

  const write = (name: string, text: string): string => {
    const file = join(dir, name);

    writeFileSync(file, text);

    return file;
  };

  it('counts a skipped, a duplicate and an unparsed file, and loads the rest', () => {
    const context = auditContext();
    const bucket = emptyCounts();
    const good = write('good.ts', 'const a = 1;\n');

    const actual = load(context, write('compiled.js', 'x;\n//# sourceMappingURL=x.map\n'), bucket);
    expect(actual).toBeUndefined();
    const actual2 = load(context, write('broken.ts', 'const = ;\n'), bucket);
    expect(actual2).toBeUndefined();
    const sliced = load(context, good, bucket)?.slice(0, 2);
    const expected = ['const a = 1;\n', 'file.ts'];
    expect(sliced).toStrictEqual(expected);
    const actual3 = load(context, write('copy.ts', 'const a = 1;\n'), bucket);
    expect(actual3).toBeUndefined();

    const expected2 = {
      ...emptyCounts(),
      compiled: 1,
      duplicate: 1,
      unparsed: 1,
    };
    expect(bucket).toStrictEqual(expected2);
  });
});
