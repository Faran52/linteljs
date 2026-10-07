import {
  alphabetically,
  commentsIn,
  FIXER_SAMPLES,
  type FixerSample,
  fixWith,
  isSfcSample,
  openerLinesIn,
  parseableSamples,
  parseErrorsIn,
  runtimeErrorIn,
  tokensIn,
} from '@mocks/fixerSamples';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { rules } from './rules/registry.ts';

import type { FixShape } from './types.ts';

const rowOf = (sample: FixerSample) => {
  const row = [sample.name, sample] as const;

  return row;
};

const ruleNames = Object.keys(rules);
const samples = parseableSamples()
  .map(rowOf);

describe('the corpus', () => {
  const sfc = FIXER_SAMPLES
    .filter(isSfcSample)
    .map(rowOf);

  it('holds samples for every component parser', () => {
    const extensions = sfc
      .map(([, sample]) => {
        return sample.filename?.replace(/^.*\./, '');
      });

    const actual = new Set(extensions);

    expect(actual).toEqual(new Set([
      'astro',
      'svelte',
      'vue',
    ]));
  });

  it.each(sfc)('parses %s', (_label, sample: FixerSample) => {
    const parseErrors = parseErrorsIn(sample.code, sample.typescript, sample.filename);
    expect(parseErrors).toEqual([]);
  });
});

describe.each(ruleNames)('%s', (name) => {
  it.each(samples)('leaves %s parseable after --fix', (_label, sample: FixerSample) => {
    const parseErrors = parseErrorsIn(fixWith(sample, name), sample.typescript, sample.filename);
    expect(parseErrors).toEqual([]);
  });

  it.each(samples)('settles on %s', (_label, sample: FixerSample) => {
    const once = fixWith(sample, name);
    const twice = fixWith({
      ...sample,
      code: once,
    }, name);

    expect(twice).toBe(once);
  });
});

describe.each(ruleNames)('%s line endings', (name) => {
  const windows = parseableSamples()
    .filter((sample) => {
      return sample.crlf === true;
    })
    .map(rowOf);

  it.each(windows)('keeps CRLF intact on %s', (_label, sample: FixerSample) => {
    const matches = /(?<!\r)\n/.test(fixWith(sample, name));
    expect(matches).toBe(false);
  });

  const unix = parseableSamples()
    .filter((sample) => {
      return sample.strayCrlf === true;
    })
    .map(rowOf);

  it.each(unix)('keeps a stray CRLF from spreading on %s', (_label, sample: FixerSample) => {
    const parts = fixWith(sample, name).split('\r\n');
    expect(parts).toHaveLength(sample.code.split('\r\n').length);
  });
});

describe.each(ruleNames)('%s comments', (name) => {
  const commented = parseableSamples()
    .filter((sample) => {
      return sample.code.includes('/*') || sample.code.includes('//');
    })
    .map(rowOf);

  it.each(commented)('keeps every comment in %s', (_label, sample: FixerSample) => {
    const before = (sample.code.match(/\/\*|\/\//g) ?? []).length;
    const after = (fixWith(sample, name).match(/\/\*|\/\//g) ?? []).length;

    expect(after).toBeGreaterThanOrEqual(before);
  });

  it.each(commented)('keeps each comment whole in %s', (_label, sample: FixerSample) => {
    const before = commentsIn(sample.code, sample.typescript, sample.filename);
    const after = commentsIn(fixWith(sample, name), sample.typescript, sample.filename);

    expect(after).toEqual(expect.arrayContaining(before));
  });
});

const isIndented = (line: string): boolean => {
  return /^[\t ]/.test(line);
};

const lostIndents = (sample: FixerSample, fixed: string): string[] => {
  const before = sample.code.split(/\r?\n/);
  const after = fixed.split(/\r?\n/);
  const beforeLines = before
    .map((line) => {
      return line.trim();
    });

  const texts = new Set(beforeLines);
  const afterLines = after
    .map((line) => {
      return line.trim();
    });

  const survivors = new Set(afterLines);
  const openers = openerLinesIn(fixed, sample.typescript, sample.filename);

  const keptOrDeeper = (line: string): boolean => {
    const indent = line.slice(0, line.length - line.trimStart().length);

    return after
      .some((fixedLine) => {
        return fixedLine.trim() === line.trim() && fixedLine.startsWith(indent);
      });
  };

  const moved = before
    .filter((line) => {
      const text = line.trim();

      return isIndented(line) && survivors.has(text) && !keptOrDeeper(line);
    });

  const isAccountedFor = (line: string): boolean => {
    const text = line.trim();

    return text === '' || isIndented(line) || texts.has(text);
  };

  const strandsOpener = (line: string, opener: number): boolean => {
    return !/^[)\]}]/.test(line) || isIndented(after[opener] ?? '');
  };

  const strandsSibling = (index: number): boolean => {
    const next = after
      .findIndex((sibling, at) => {
        return at > index && sibling.trim() !== '';
      });
    const sibling = after[next] ?? '';

    return openers[next] === undefined && before.includes(sibling) && isIndented(sibling);
  };

  const stranded = after
    .filter((line, index) => {
      if (isAccountedFor(line)) {
        return false;
      }

      const opener = openers[index];

      return opener === undefined ? strandsSibling(index) : strandsOpener(line, opener);
    });

  const lost = [...moved, ...stranded];

  return lost;
};

describe('the indentation check', () => {
  const sample = {
    name: 'a function body',
    code: 'function run() {\n  const value = 1;\n\n  return value;\n}\n',
  };

  it('lets an inserted top-level statement through', () => {
    const lost = lostIndents(sample, `import { helper } from 'mod';\n\n${sample.code}`);
    expect(lost).toEqual([]);
  });

  it('catches a line that lost its indent', () => {
    const lost = lostIndents(sample, 'function run() {\nconst value = 1;\n\n  return value;\n}\n');
    expect(lost).toEqual(['  const value = 1;']);
  });

  it('lets a surviving line move deeper', () => {
    const deeper = lostIndents(sample, 'function run() {\n    const value = 1;\n\n  return value;\n}\n');

    expect(deeper).toEqual([]);
  });

  it('catches a line split out at column 0 inside brackets', () => {
    const lost = lostIndents(sample, 'function run() {\n  const value =\n1;\n\n  return value;\n}\n');
    expect(lost).toEqual(['1;']);
  });

  it('catches a closer at column 0 under a bracket opened on an indented line', () => {
    const lost = lostIndents(sample, 'function run() {\n  const value = [\n    1,\n];\n\n  return value;\n}\n');
    expect(lost).toEqual(['];']);
  });

  it('catches a new statement at column 0 ahead of an indented sibling', () => {
    const script = {
      name: 'a component script',
      code: '<script lang="ts">\n  const state = 0;\n</script>\n',
      filename: 'Script.svelte',
    };

    const lost = lostIndents(script, "<script lang=\"ts\">\nimport { x } from 'mod';\n  const state = 0;\n</script>\n");
    expect(lost).toEqual(["import { x } from 'mod';"]);
  });
});

describe.each(ruleNames)('%s indentation', (name) => {
  it.each(samples)('keeps every indent in %s', (_label, sample: FixerSample) => {
    const actual = lostIndents(sample, fixWith(sample, name));
    expect(actual).toEqual([]);
  });
});

const namesIn = (shape: FixShape): string[] => {
  return Object.entries(rules)
    .filter(([, rule]) => {
      return rule.meta.docs.fixShape === shape;
    })
    .map(([name]) => {
      return name;
    });
};

const whitespaceRules = namesIn('whitespace');

describe.each(whitespaceRules)('%s tokens', (name) => {
  it.each(samples)('rewrites no code in %s', (_label, sample: FixerSample) => {
    const tokens = tokensIn(fixWith(sample, name), sample.typescript, sample.filename);

    expect(tokens)
      .toEqual(tokensIn(sample.code, sample.typescript, sample.filename));
  });
});

const reorderRules = namesIn('reorder');

describe.each(reorderRules)('%s tokens', (name) => {
  it.each(samples)('keeps every token in %s', (_label, sample: FixerSample) => {
    const fixed = fixWith(sample, name);
    const fixedTokens = tokensIn(fixed, sample.typescript, sample.filename)
      .sort(alphabetically);

    const originalTokens = tokensIn(sample.code, sample.typescript, sample.filename)
      .sort(alphabetically);

    expect(fixedTokens).toEqual(originalTokens);
  });
});

const runnable = samples
  .filter(([, sample]) => {
    return !isSfcSample(sample) && runtimeErrorIn(sample.code, sample.filename) === undefined;
  });

const runtimeErrorAfter = (sample: FixerSample, fixed: string): string | undefined => {
  return fixed === sample.code ? undefined : runtimeErrorIn(fixed, sample.filename);
};

describe.each(ruleNames)('%s runtime', (name) => {
  it.each(runnable)('still runs %s', (_label, sample: FixerSample) => {
    const runtimeError = runtimeErrorAfter(sample, fixWith(sample, name));
    expect(runtimeError).toBeUndefined();
  });
});

describe('the whole plugin at once', () => {
  it.each(samples)('leaves %s parseable', (_label, sample: FixerSample) => {
    const parseErrors = parseErrorsIn(fixWith(sample), sample.typescript, sample.filename);
    expect(parseErrors).toEqual([]);
  });

  it.each(runnable)('still runs %s', (_label, sample: FixerSample) => {
    const runtimeError = runtimeErrorAfter(sample, fixWith(sample));
    expect(runtimeError).toBeUndefined();
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
