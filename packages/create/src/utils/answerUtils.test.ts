import { answersFor } from '@mocks/answersFor';

import {
  browsersOf,
  hasLibrary,
  hasSurface,
  hasTests,
  localesOf,
  projectDirectoryOf,
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

    const hasZod = hasLibrary(answers, 'zod');
    expect(hasZod).toBe(true);
    const hasTsPattern = hasLibrary(answers, 'ts-pattern');
    expect(hasTsPattern).toBe(false);
  });
});

describe('surfacesOf', () => {
  it('answers what was chosen, and the pair an older config means by saying nothing', () => {
    const chosen = answersFor({ surfaces: ['devtools-panel'] });

    const chosenSurfaces = surfacesOf(chosen);
    const expectedChosen = ['devtools-panel'];
    expect(chosenSurfaces).toEqual(expectedChosen);
    const defaultSurfaces = surfacesOf(answersFor());
    const expectedDefault = ['popup', 'background'];
    expect(defaultSurfaces).toEqual(expectedDefault);
  });
});

describe('hasSurface', () => {
  it('reads the chosen surfaces', () => {
    const answers = answersFor({ surfaces: ['devtools-panel'] });

    const hasPanel = hasSurface(answers, 'devtools-panel');
    expect(hasPanel).toBe(true);
    const hasPopup = hasSurface(answers, 'popup');
    expect(hasPopup).toBe(false);
  });
});

describe('browsersOf', () => {
  it('leads with the primary browser and carries it once', () => {
    const both = answersFor({
      browser: 'firefox',
      browsers: ['chrome', 'firefox'],
    });

    const bothBrowsers = browsersOf(both);
    const expectedBoth = ['firefox', 'chrome'];
    expect(bothBrowsers).toEqual(expectedBoth);
    const defaultBrowsers = browsersOf(answersFor());
    const expectedDefault = ['chrome'];
    expect(defaultBrowsers).toEqual(expectedDefault);
  });
});

describe('hasTests', () => {
  it('holds for every testing answer but none', () => {
    const testsByDefault = hasTests(answersFor());
    expect(testsByDefault).toBe(true);
    const testsWithNone = hasTests(answersFor({ testing: 'none' }));
    expect(testsWithNone).toBe(false);
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

describe('projectDirectoryOf', () => {
  it('answers the root for a single repo and apps/<name> for a monorepo', () => {
    const single = projectDirectoryOf(answersFor({}), '@acme/shop');
    expect(single).toBe('.');
    const monorepo = projectDirectoryOf(answersFor({ layout: 'monorepo' }), '@acme/shop');
    expect(monorepo).toBe('apps/shop');
  });

  it('kebab-cases a monorepo app directory', () => {
    const directory = projectDirectoryOf(answersFor({ layout: 'monorepo' }), 'my_app');
    expect(directory).toBe('apps/my-app');
  });

  it('puts a TypeScript project under packages/<name>', () => {
    const directory = projectDirectoryOf(answersFor({
      layout: 'monorepo',
      target: 'typescript',
    }), '@acme/shared');
    expect(directory).toBe('packages/shared');
  });
});
