import {
  alphabetically,
  commentsIn,
  type FixerSample,
  fixWith,
  parseableSamples,
  parseErrorsIn,
  tokensIn,
} from '@mocks/fixerSamples';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { rules } from './rules/index.ts';

import type { RuleCategory } from './types.ts';

const ruleNames = Object.keys(rules);
const samples = parseableSamples().map((sample) => {
  return [sample.name, sample] as const;
});

describe.each(ruleNames)('%s', (name) => {
  it.each(samples)('leaves %s parseable after --fix', (_label, sample: FixerSample) => {
    expect(parseErrorsIn(fixWith(sample, name), sample.typescript, sample.filename)).toEqual([]);
  });

  it.each(samples)('settles on %s', (_label, sample: FixerSample) => {
    const once = fixWith(sample, name);
    const twice = fixWith({
      ...sample,
      code: once,
    }, name);

    // A fixer that keeps editing on a second pass never reaches a stable file.
    expect(twice).toBe(once);
  });
});

describe.each(ruleNames)('%s line endings', (name) => {
  const windows = parseableSamples().filter((sample) => {
    return sample.crlf === true;
  }).map((sample) => {
    return [sample.name, sample] as const;
  });

  // A fix that writes bare \n into a CRLF file leaves mixed endings behind.
  it.each(windows)('keeps CRLF intact on %s', (_label, sample: FixerSample) => {
    expect(/(?<!\r)\n/.test(fixWith(sample, name))).toBe(false);
  });
});

// A fixer that cannot carry a comment across must decline the fix, not delete the comment.
describe.each(ruleNames)('%s comments', (name) => {
  const commented = parseableSamples().filter((sample) => {
    return sample.code.includes('/*') || sample.code.includes('//');
  }).map((sample) => {
    return [sample.name, sample] as const;
  });

  it.each(commented)('keeps every comment in %s', (_label, sample: FixerSample) => {
    const before = (sample.code.match(/\/\*|\/\//g) ?? []).length;
    const after = (fixWith(sample, name).match(/\/\*|\/\//g) ?? []).length;

    expect(after).toBeGreaterThanOrEqual(before);
  });

  // Two line comments merged onto one line pass the count above but corrupt both.
  it.each(commented)('keeps each comment whole in %s', (_label, sample: FixerSample) => {
    const after = commentsIn(fixWith(sample, name), sample.typescript, sample.filename);

    expect(after).toEqual(expect.arrayContaining(commentsIn(sample.code, sample.typescript, sample.filename)));
  });
});

const linesAtMargin = (code: string): number => {
  return code.split(/\r?\n/).filter((line) => {
    return line.trim() !== '' && !/^[\t ]/.test(line);
  }).length;
};

describe.each(ruleNames)('%s indentation', (name) => {
  const indented = parseableSamples().filter((sample) => {
    return /^[\t ]+\S/m.test(sample.code);
  }).map((sample) => {
    return [sample.name, sample] as const;
  });

  // A fix landing at column 0 inside indented code drops that indentation.
  it.each(indented)('writes nothing new at column 0 in %s', (_label, sample: FixerSample) => {
    expect(linesAtMargin(fixWith(sample, name))).toBeLessThanOrEqual(linesAtMargin(sample.code));
  });
});

const namesIn = (category: RuleCategory): string[] => {
  return Object.entries(rules).filter(([, rule]) => {
    return rule.meta.docs.category === category;
  }).map(([name]) => {
    return name;
  });
};

// Only the token stream, not the text, can tell a code change from a whitespace one.
describe.each(namesIn('layout'))('%s tokens', (name) => {
  it.each(samples)('rewrites no code in %s', (_label, sample: FixerSample) => {
    expect(tokensIn(fixWith(sample, name), sample.typescript, sample.filename))
      .toEqual(tokensIn(sample.code, sample.typescript, sample.filename));
  });
});

// Ordering rules move tokens on purpose, so only the multiset has to match, not the order.
describe.each(namesIn('ordering'))('%s tokens', (name) => {
  it.each(samples)('keeps every token in %s', (_label, sample: FixerSample) => {
    expect(tokensIn(fixWith(sample, name), sample.typescript, sample.filename).sort(alphabetically))
      .toEqual(tokensIn(sample.code, sample.typescript, sample.filename).sort(alphabetically));
  });
});

describe('the whole plugin at once', () => {
  it.each(samples)('leaves %s parseable', (_label, sample: FixerSample) => {
    expect(parseErrorsIn(fixWith(sample), sample.typescript, sample.filename)).toEqual([]);
  });

  it.each(samples)('settles on %s', (_label, sample: FixerSample) => {
    const once = fixWith(sample);
    const twice = fixWith({
      ...sample,
      code: once,
    });

    expect(twice).toBe(once);
  });
});
