import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';

import { storiesAnswer } from './storiesAnswer';

import type { HostedFramework, TargetId } from '@config/types';

describe('storiesAnswer', () => {
  it('is keyed stories', () => {
    expect(storiesAnswer.key).toBe('stories');
  });

  it.each<[TargetId, HostedFramework | undefined, boolean]>([
    [
      'react',
      undefined,
      true,
    ],
    [
      'next',
      undefined,
      true,
    ],
    [
      'vue',
      undefined,
      true,
    ],
    [
      'nuxt',
      undefined,
      true,
    ],
    [
      'svelte',
      undefined,
      true,
    ],
    [
      'angular',
      undefined,
      true,
    ],
    [
      'astro',
      'react',
      true,
    ],
    [
      'astro',
      'vue',
      true,
    ],
    [
      'astro',
      'svelte',
      true,
    ],
    [
      'astro',
      'solid',
      false,
    ],
    [
      'astro',
      undefined,
      false,
    ],
    [
      'solid',
      undefined,
      false,
    ],
    [
      'react-native',
      undefined,
      false,
    ],
    [
      'webextension',
      'react',
      false,
    ],
    [
      'typescript',
      undefined,
      false,
    ],
  ])('takes a slot on %s hosting %s: %s', (target, hostedFramework, expected) => {
    const record = targetFor({
      ...DEFAULT_ANSWERS,
      target,
      ...(hostedFramework === undefined ? {} : { hostedFramework }),
    });

    const slotted = storiesAnswer.slot(record);
    expect(slotted).toBe(expected);
  });
});
