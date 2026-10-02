import { ANSWERS } from '../registry';

import {
  readAnswer,
  refuseDuplicates,
  unaskedValueOf,
} from './readUtils';

import type { TextRecord } from '../types';

describe('readAnswer', () => {
  it('reads a choice', () => {
    const answer = readAnswer(ANSWERS.testing, 'none');
    expect(answer).toBe('none');

    expect(() => {
      return readAnswer(ANSWERS.testing, 'jest');
    }).toThrow('testing must be one of: vitest, none');
  });

  it('reads an optional choice', () => {
    const answer = readAnswer(ANSWERS.form, 'tanstack-form');
    expect(answer).toBe('tanstack-form');
    const answer2 = readAnswer(ANSWERS.form, undefined);
    expect(answer2).toBeUndefined();

    expect(() => {
      return readAnswer(ANSWERS.form, 'formik');
    }).toThrow('form must be one of: tanstack-form, react-hook-form');
  });

  it('reads a multi', () => {
    const answer = readAnswer(ANSWERS.agents, ['codex', 'cursor']);
    const expected = ['codex', 'cursor'];
    expect(answer).toEqual(expected);

    expect(() => {
      return readAnswer(ANSWERS.agents, ['gemini']);
    }).toThrow('agents must be one of: claude-code, codex, copilot, cursor');

    expect(() => {
      return readAnswer(ANSWERS.agents, 'codex');
    }).toThrow('agents must be an array');
  });

  it('reads an optional multi', () => {
    const answer = readAnswer(ANSWERS.surfaces, ['popup']);
    const expected = ['popup'];
    expect(answer).toEqual(expected);
    const answer2 = readAnswer(ANSWERS.surfaces, undefined);
    expect(answer2).toBeUndefined();

    expect(() => {
      return readAnswer(ANSWERS.surfaces, ['sidebar']);
    }).toThrow('surfaces must be one of: popup, background, devtools-panel');

    expect(() => {
      return readAnswer(ANSWERS.browsers, []);
    }).toThrow('browsers must contain at least 1 value');
  });

  it('reads a list', () => {
    const answer = readAnswer(ANSWERS.ignores, ['generated/api.ts']);
    const expected = ['generated/api.ts'];
    expect(answer).toEqual(expected);
    const answer2 = readAnswer(ANSWERS.ignores, undefined);
    expect(answer2).toBeUndefined();

    expect(() => {
      return readAnswer(ANSWERS.ignores, []);
    }).toThrow('ignores must be a non-empty array');

    expect(() => {
      return readAnswer(ANSWERS.ignores, ['a', '']);
    }).toThrow('ignores must contain only non-empty strings');

    expect(() => {
      return readAnswer(ANSWERS.ignores, ['a', 2]);
    }).toThrow('ignores must contain only non-empty strings');
  });

  it('reads a text', () => {
    const answer = readAnswer(ANSWERS.packageManagerVersion, '12.5.1');
    expect(answer).toBe('12.5.1');
    const answer2 = readAnswer(ANSWERS.packageManagerVersion, undefined);
    expect(answer2).toBeUndefined();

    expect(() => {
      return readAnswer(ANSWERS.packageManagerVersion, 12);
    }).toThrow('packageManagerVersion must be a string');

    expect(() => {
      return readAnswer(ANSWERS.nodeVersion, 26);
    }).toThrow('nodeVersion must be a string');
  });

  it('names the pattern a string fails, not a type', () => {
    const { pattern } = ANSWERS.nodeVersion;

    expect(() => {
      return readAnswer(ANSWERS.nodeVersion, '26');
    }).toThrow(`nodeVersion must match ${pattern}`);
  });

  it('reads a map', () => {
    const answer = readAnswer(ANSWERS.aliases, { '@app/*': 'src/*' });
    const expected = { '@app/*': 'src/*' };
    expect(answer).toEqual(expected);
    const answer2 = readAnswer(ANSWERS.aliases, undefined);
    expect(answer2).toBeUndefined();

    expect(() => {
      return readAnswer(ANSWERS.aliases, { 'app/*': 'src/*' });
    }).toThrow('aliases key must start with @ or $: app/*');

    expect(() => {
      return readAnswer(ANSWERS.aliases, ['@app/*']);
    }).toThrow('aliases must be an object');

    expect(() => {
      return readAnswer(ANSWERS.aliases, { '@app/*': '' });
    }).toThrow('aliases.@app/* must be a non-empty string');

    expect(() => {
      return readAnswer(ANSWERS.aliases, { '@app/*': 3 });
    }).toThrow('aliases.@app/* must be a non-empty string');
  });
});

describe('readAnswer, on the wrong shape', () => {
  it('refuses a value wrapped in an array where one value belongs', () => {
    expect(() => {
      return readAnswer(ANSWERS.testing, ['vitest']);
    }).toThrow('testing must be one of: vitest, none');

    expect(() => {
      return readAnswer(ANSWERS.agents, [['codex']]);
    }).toThrow('agents must be one of: claude-code, codex, copilot, cursor');

    expect(() => {
      return readAnswer(ANSWERS.packageManagerVersion, ['12.5.1']);
    }).toThrow('packageManagerVersion must be a string');
  });

  it('reads a pattern with unicode semantics, as the JSON schema does', () => {
    const record: TextRecord = {
      kind: 'text',
      key: 'probe',
      pattern: '^.$',
    };

    const answer = readAnswer(record, '\u{1F600}');
    expect(answer).toBe('\u{1F600}');
  });
});

describe('unaskedValueOf', () => {
  it('lets the kind decide, not a default the record carries', () => {
    const unaskedValue = unaskedValueOf({
      ...ANSWERS.testing,
      kind: 'optionalChoice',
      none: { label: 'None' },
    });
    expect(unaskedValue).toBeUndefined();
  });

  it('answers nothing for a kind a target never asks', () => {
    const unaskedValue = unaskedValueOf(ANSWERS.store);
    expect(unaskedValue).toBeUndefined();
    const unaskedValue2 = unaskedValueOf(ANSWERS.router);
    expect(unaskedValue2).toBeUndefined();
  });

  it('answers the default for the two kinds required in Answers', () => {
    const unaskedValue = unaskedValueOf(ANSWERS.testing);
    expect(unaskedValue).toBe('vitest');
    const unaskedValue2 = unaskedValueOf(ANSWERS.agents);
    const expected = ['claude-code'];
    expect(unaskedValue2).toEqual(expected);
  });

  it('answers undefined for the five kinds optional in Answers', () => {
    const unaskedValue = unaskedValueOf(ANSWERS.form);
    expect(unaskedValue).toBeUndefined();
    const unaskedValue2 = unaskedValueOf(ANSWERS.surfaces);
    expect(unaskedValue2).toBeUndefined();
    const unaskedValue3 = unaskedValueOf(ANSWERS.ignores);
    expect(unaskedValue3).toBeUndefined();
    const unaskedValue4 = unaskedValueOf(ANSWERS.aliases);
    expect(unaskedValue4).toBeUndefined();
    const unaskedValue5 = unaskedValueOf(ANSWERS.nodeVersion);
    expect(unaskedValue5).toBeUndefined();
  });
});

describe('refuseDuplicates', () => {
  it('names the field a repeated value came from and passes distinct ones', () => {
    expect(() => {
      refuseDuplicates(['esm', 'esm'], 'resolveConditions');
    }).toThrow('resolveConditions must not contain duplicate values');

    expect(() => {
      refuseDuplicates(['esm', 'cjs'], 'resolveConditions');
    }).not.toThrow();
  });
});
