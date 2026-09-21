import { ANSWERS } from '../registry';

import {
  readAnswer,
  refuseDuplicates,
  unaskedValueOf,
} from './readUtils';

// One reader per kind, so the suite is one case per kind: what a legal value reads back as, what an illegal one
// refuses with, and, for the four kinds that are optional in `Answers`, what an absent one answers.
describe('readAnswer', () => {
  it('reads a boolean', () => {
    expect(readAnswer(ANSWERS.store, true)).toBe(true);
    expect(() => {
      return readAnswer(ANSWERS.store, 'true');
    }).toThrow('store must be a boolean');
  });

  it('reads a choice', () => {
    expect(readAnswer(ANSWERS.testing, 'none')).toBe('none');
    expect(() => {
      return readAnswer(ANSWERS.testing, 'jest');
    }).toThrow('testing must be one of: vitest, none');
  });

  it('reads an optional choice', () => {
    expect(readAnswer(ANSWERS.form, 'tanstack-form')).toBe('tanstack-form');
    expect(readAnswer(ANSWERS.form, undefined)).toBeUndefined();
    expect(() => {
      return readAnswer(ANSWERS.form, 'formik');
    }).toThrow('form must be one of: tanstack-form, react-hook-form');
  });

  it('reads a multi', () => {
    expect(readAnswer(ANSWERS.agents, ['codex', 'cursor'])).toEqual(['codex', 'cursor']);
    expect(() => {
      return readAnswer(ANSWERS.agents, ['gemini']);
    }).toThrow('agents must be one of: claude-code, codex, copilot, cursor');
  });

  it('reads an optional multi', () => {
    expect(readAnswer(ANSWERS.surfaces, ['popup'])).toEqual(['popup']);
    expect(readAnswer(ANSWERS.surfaces, undefined)).toBeUndefined();
    expect(() => {
      return readAnswer(ANSWERS.surfaces, ['sidebar']);
    }).toThrow('surfaces must be one of: popup, background, devtools-panel');
  });

  it('reads a list', () => {
    expect(readAnswer(ANSWERS.ignores, ['generated/api.ts'])).toEqual(['generated/api.ts']);
    expect(readAnswer(ANSWERS.ignores, undefined)).toBeUndefined();
    expect(() => {
      return readAnswer(ANSWERS.ignores, []);
    }).toThrow('ignores must be a non-empty array');
  });

  it('reads a text', () => {
    expect(readAnswer(ANSWERS.packageManagerVersion, '12.5.1')).toBe('12.5.1');
    expect(readAnswer(ANSWERS.packageManagerVersion, undefined)).toBeUndefined();
    expect(() => {
      return readAnswer(ANSWERS.packageManagerVersion, 12);
    }).toThrow('packageManagerVersion must be a string');
    expect(() => {
      return readAnswer(ANSWERS.nodeVersion, '26');
    }).toThrow('nodeVersion must be a string');
  });

  it('reads a map', () => {
    expect(readAnswer(ANSWERS.aliases, { '@app/*': 'src/*' })).toEqual({ '@app/*': 'src/*' });
    expect(readAnswer(ANSWERS.aliases, undefined)).toBeUndefined();
    expect(() => {
      return readAnswer(ANSWERS.aliases, { 'app/*': 'src/*' });
    }).toThrow('aliases key must start with @ or $: app/*');
  });
});

describe('unaskedValueOf', () => {
  it('answers false for the one boolean kind', () => {
    expect(unaskedValueOf(ANSWERS.store)).toBe(false);
  });

  it('answers the default for the two kinds required in Answers', () => {
    expect(unaskedValueOf(ANSWERS.testing)).toBe('vitest');
    expect(unaskedValueOf(ANSWERS.agents)).toEqual(['claude-code']);
  });

  it('answers undefined for the five kinds optional in Answers', () => {
    expect(unaskedValueOf(ANSWERS.form)).toBeUndefined();
    expect(unaskedValueOf(ANSWERS.surfaces)).toBeUndefined();
    expect(unaskedValueOf(ANSWERS.ignores)).toBeUndefined();
    expect(unaskedValueOf(ANSWERS.aliases)).toBeUndefined();
    expect(unaskedValueOf(ANSWERS.nodeVersion)).toBeUndefined();
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
