import { answersFor } from '@mocks/answersFor';

import {
  browsersOf,
  hasLibrary,
  hasSurface,
  hasTests,
  localesOf,
  rendersWithReact,
  surfacesOf,
} from './answerUtils';

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
    const answers = answersFor({
      libraries: ['zod'],
      styling: 'tailwind',
    });

    expect(hasLibrary(answers, 'zod')).toBe(true);
    expect(hasLibrary(answers, 'ts-pattern')).toBe(false);
  });
});

describe('surfacesOf', () => {
  it('answers what was chosen, and the pair an older config means by saying nothing', () => {
    const chosen = answersFor({ surfaces: ['devtools-panel'] });

    expect(surfacesOf(chosen)).toEqual(['devtools-panel']);
    expect(surfacesOf(answersFor())).toEqual(['popup', 'background']);
  });
});

describe('hasSurface', () => {
  it('reads the chosen surfaces', () => {
    const answers = answersFor({ surfaces: ['devtools-panel'] });

    expect(hasSurface(answers, 'devtools-panel')).toBe(true);
    expect(hasSurface(answers, 'popup')).toBe(false);
  });
});

describe('browsersOf', () => {
  it('leads with the primary browser and carries it once', () => {
    const both = answersFor({
      browser: 'firefox',
      browsers: ['chrome', 'firefox'],
    });

    expect(browsersOf(both)).toEqual(['firefox', 'chrome']);
    expect(browsersOf(answersFor())).toEqual(['chrome']);
  });
});

describe('hasTests', () => {
  it('holds for every testing answer but none', () => {
    expect(hasTests(answersFor())).toBe(true);
    expect(hasTests(answersFor({ testing: 'none' }))).toBe(false);
  });
});

describe('localesOf', () => {
  it.each<[string, Parameters<typeof answersFor>[0], string[]]>([
    [
      'nothing when unanswered',
      {},
      [],
    ],
    [
      'nothing when answered empty',
      { languages: [] },
      [],
    ],
    [
      'English first, once',
      { languages: [
        'ja',
        'en',
        'ar',
      ] },
      [
        'en',
        'ja',
        'ar',
      ],
    ],
  ])('answers %s', (_label, chosen, expected) => {
    expect(localesOf(answersFor(chosen))).toEqual(expected);
  });
});
