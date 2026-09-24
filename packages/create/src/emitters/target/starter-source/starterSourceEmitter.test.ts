import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type TargetId,
} from '#answers';

import { starterSourceEmitter } from './starterSourceEmitter';

const answersFor = (overrides: Partial<Answers> = {}): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

// `<destination> -> <asset>`, which is the whole of what this emitter decides.
const sourcesByTarget = (overrides: Partial<Answers>): Record<string, string> => {
  return Object.fromEntries(starterSourceEmitter(answersFor(overrides)).flatMap((artifact) => {
    return 'sources' in artifact.content
      ? artifact.content.sources.map((source) => {
          return [artifact.target, source];
        })
      : [];
  }));
};

/**
 * A record names the destination and this derives the asset from it, so these are the cases where the derivation
 * has to add something: an answer that picks one of several spellings filling one path. `registry.test.ts` holds
 * every derived path against what is on disk; this holds which one is derived.
 */
describe('the asset a destination derives', () => {
  it('reads it straight off the destination where no answer gates the file', () => {
    expect(sourcesByTarget({ target: 'astro' })['src/lib/utils/currentPath.ts'])
      .toBe('starter-source/astro/src/lib/utils/currentPath.ts');
  });

  // Found end to end: the Firefox project shipped Chrome's entry against types declaring `browser.*` alone.
  it.each<[TargetId, string]>([
    ['webextension', 'chrome'],
    ['webextension', 'firefox'],
  ])('puts the %s starter under the browser it is written for: %s', (target, browser) => {
    expect(sourcesByTarget({
      target,
      browser: browser as 'chrome' | 'firefox',
      surfaces: ['background'],
    })['src/background/index.ts'])
      .toBe(`starter-source/webextension/${browser}/src/background/index.ts`);
  });

  // Three spellings of `App` fill one destination, so the destination alone cannot say which file to copy.
  it.each([
    ['react-router'],
    ['tanstack-router'],
  ])('puts the react starter under the router that asked for it: %s', (router) => {
    expect(sourcesByTarget({
      target: 'react',
      router: router as 'react-router' | 'tanstack-router',
    })['src/App.tsx'])
      .toBe(`starter-source/react/${router}/src/App.tsx`);
  });

  it('takes the base spelling of a varying file when no answer opens a variant', () => {
    expect(sourcesByTarget({ target: 'react' })['src/App.tsx'])
      .toBe('starter-source/react/src/App.tsx');
  });

  // A file a library gates ships only with it, and sits under that library's own directory.
  it('puts a library-gated starter under the library that brings it', () => {
    expect(sourcesByTarget({
      target: 'react-native',
      libraries: [],
      styling: 'tailwind',
    })['metro.config.js'])
      .toBe('starter-source/react-native/tailwind/metro.config.js');
  });

  it('writes nothing for a styling answer that was not chosen', () => {
    expect(sourcesByTarget({
      target: 'react-native',
      libraries: [],
    })['nativewind-env.d.ts'])
      .toBeUndefined();
  });

  // Expo's default Metro config serves a project without NativeWind, which is the one thing that wraps it.
  it('writes a metro config under tailwind alone', () => {
    expect(sourcesByTarget({
      target: 'react-native',
      libraries: [],
      styling: 'tailwind',
    })['metro.config.js'])
      .toBe('starter-source/react-native/tailwind/metro.config.js');
    expect(sourcesByTarget({
      target: 'react-native',
      libraries: [],
    })['metro.config.js'])
      .toBeUndefined();
  });
});
