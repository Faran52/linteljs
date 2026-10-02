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
    const reactRendersWithReact = rendersWithReact('react');
    expect(reactRendersWithReact).toBe(true);
    const nextRendersWithReact = rendersWithReact('next');
    expect(nextRendersWithReact).toBe(true);
    const reactNativeRendersWithReact = rendersWithReact('react-native');
    expect(reactNativeRendersWithReact).toBe(true);
    const vueRendersWithReact = rendersWithReact('vue');
    expect(vueRendersWithReact).toBe(false);
    const undefinedRendersWithReact = rendersWithReact(undefined);
    expect(undefinedRendersWithReact).toBe(false);
  });
});

describe('hasLibrary', () => {
  it('reads the chosen libraries', () => {
    const answers = answersFor({
      libraries: ['zod'],
      styling: 'tailwind',
    });

    const answersHasLibrary = hasLibrary(answers, 'zod');
    expect(answersHasLibrary).toBe(true);
    const answersHasLibrary2 = hasLibrary(answers, 'ts-pattern');
    expect(answersHasLibrary2).toBe(false);
  });
});

describe('surfacesOf', () => {
  it('answers what was chosen, and the pair an older config means by saying nothing', () => {
    const chosen = answersFor({ surfaces: ['devtools-panel'] });

    const chosenSurfaces = surfacesOf(chosen);
    const expected = ['devtools-panel'];
    expect(chosenSurfaces).toEqual(expected);
    const surfaces2 = surfacesOf(answersFor());
    const expected2 = ['popup', 'background'];
    expect(surfaces2).toEqual(expected2);
  });
});

describe('hasSurface', () => {
  it('reads the chosen surfaces', () => {
    const answers = answersFor({ surfaces: ['devtools-panel'] });

    const answersHasSurface = hasSurface(answers, 'devtools-panel');
    expect(answersHasSurface).toBe(true);
    const answersHasSurface2 = hasSurface(answers, 'popup');
    expect(answersHasSurface2).toBe(false);
  });
});

describe('browsersOf', () => {
  it('leads with the primary browser and carries it once', () => {
    const both = answersFor({
      browser: 'firefox',
      browsers: ['chrome', 'firefox'],
    });

    const bothBrowsers = browsersOf(both);
    const expected = ['firefox', 'chrome'];
    expect(bothBrowsers).toEqual(expected);
    const browsers2 = browsersOf(answersFor());
    const expected2 = ['chrome'];
    expect(browsers2).toEqual(expected2);
  });
});

describe('hasTests', () => {
  it('holds for every testing answer but none', () => {
    const actual = hasTests(answersFor());
    expect(actual).toBe(true);
    const actual2 = hasTests(answersFor({ testing: 'none' }));
    expect(actual2).toBe(false);
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
    const locales = localesOf(answersFor(chosen));
    expect(locales).toEqual(expected);
  });
});
