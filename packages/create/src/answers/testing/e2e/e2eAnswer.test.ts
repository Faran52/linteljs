import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { e2eAnswer } from './e2eAnswer';

import type { TargetId } from '@config/types';

const recordFor = (target: TargetId) => {
  return targetFor({
    ...DEFAULT_ANSWERS,
    target,
  });
};

describe('e2eAnswer', () => {
  it('is keyed e2e', () => {
    expect(e2eAnswer.key).toBe('e2e');
  });

  it.each([
    ['react', true],
    ['react-native', true],
    ['webextension', true],
    ['typescript', false],
  ] as const)('takes a slot on %s: %s', (target, expected) => {
    const slotted = e2eAnswer.slot(recordFor(target));

    expect(slotted).toBe(expected);
  });

  it.each([
    ['react', 'E2E testing (Playwright)'],
    ['webextension', 'E2E testing (Playwright)'],
    ['react-native', 'E2E testing (Maestro)'],
  ] as const)('names %s\'s own tool in its prompt', (target, expected) => {
    const prompt = e2eAnswer.prompt(recordFor(target));

    expect(prompt).toBe(expected);
  });

  it.each([
    [
      'vue',
      true,
      false,
    ],
    [
      'react-native',
      false,
      true,
    ],
  ] as const)('offers on %s playwright: %s, maestro: %s', (target, playwright, maestro) => {
    const record = recordFor(target);

    const offersPlaywright = e2eAnswer.values.playwright.only(record);
    expect(offersPlaywright).toBe(playwright);
    const offersMaestro = e2eAnswer.values.maestro.only(record);
    expect(offersMaestro).toBe(maestro);
  });
});
