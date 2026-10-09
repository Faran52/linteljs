import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Question } from '../read/manifest/manifestReader';

import { choiceDefaultOf, multiDefaultOf } from './defaultUtils';

const question = (fallback: string | string[]): Question => {
  const built: Question = {
    key: 'languages',
    flag: 'languages',
    prompt: 'Languages',
    kind: Array.isArray(fallback) ? 'multi' : 'choice',
    scope: 'project',
    default: fallback,
    values: {},
  };

  return built;
};

describe('multiDefaultOf', () => {
  it('keeps the defaults that are offered', () => {
    const asked = question(['en', 'ar']);
    const kept = multiDefaultOf(asked, ['ar', 'ja']);

    expect(kept).toEqual(['ar']);
  });
});

describe('choiceDefaultOf', () => {
  it('takes the default where offered', () => {
    const asked = question('ar');
    const kept = choiceDefaultOf(asked, ['en', 'ar'], 'en');

    expect(kept).toBe('ar');
  });

  it('takes the first offer when the default is not offered', () => {
    const asked = question('gone');
    const kept = choiceDefaultOf(asked, ['en', 'ar'], 'en');

    expect(kept).toBe('en');
  });
});
