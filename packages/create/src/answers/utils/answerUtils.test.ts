import { DEFAULT_ANSWERS } from '../registry';

import {
  browsersOf,
  hasLibrary,
  hasSurface,
  hasTests,
  rendersWithReact,
  surfacesOf,
} from './answerUtils';

import type { Answers } from '../registry';

describe('rendersWithReact', () => {
  it('holds for every framework that renders with React', () => {
    expect(rendersWithReact('react')).toBe(true);
    expect(rendersWithReact('next')).toBe(true);
    expect(rendersWithReact('react-native')).toBe(true);
    expect(rendersWithReact('vue')).toBe(false);
    expect(rendersWithReact(undefined)).toBe(false);
  });
});

describe('hasLibrary', () => {
  it('reads the chosen libraries', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      libraries: ['zod', 'tailwind'],
    };

    expect(hasLibrary(answers, 'zod')).toBe(true);
    expect(hasLibrary(answers, 'ts-pattern')).toBe(false);
  });
});

describe('surfacesOf', () => {
  it('answers what was chosen, and the pair an older config means by saying nothing', () => {
    expect(surfacesOf({
      ...DEFAULT_ANSWERS,
      surfaces: ['devtools-panel'],
    })).toEqual(['devtools-panel']);
    expect(surfacesOf(DEFAULT_ANSWERS)).toEqual(['popup', 'background']);
  });
});

describe('hasSurface', () => {
  it('reads the chosen surfaces', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      surfaces: ['devtools-panel'],
    };

    expect(hasSurface(answers, 'devtools-panel')).toBe(true);
    expect(hasSurface(answers, 'popup')).toBe(false);
  });
});

describe('browsersOf', () => {
  it('leads with the primary browser and carries it once', () => {
    expect(browsersOf({
      ...DEFAULT_ANSWERS,
      browser: 'firefox',
      browsers: ['chrome', 'firefox'],
    })).toEqual(['firefox', 'chrome']);
    expect(browsersOf(DEFAULT_ANSWERS)).toEqual(['chrome']);
  });
});

describe('hasTests', () => {
  it('holds for every testing answer but none', () => {
    expect(hasTests(DEFAULT_ANSWERS)).toBe(true);
    expect(hasTests({
      ...DEFAULT_ANSWERS,
      testing: 'none',
    })).toBe(false);
  });
});
