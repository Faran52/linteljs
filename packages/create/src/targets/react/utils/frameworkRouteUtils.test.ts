import { answersFor } from '@mocks/answersFor';
import { pickedBy } from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  frameworkRouteFiles,
  frameworkRouteTests,
  isFrameworkMode,
} from './frameworkRouteUtils';

import type { Answers } from '@config/types';

const FRAMEWORK: Partial<Answers> = {
  target: 'react',
  router: 'react-router-framework',
};

const PAGES = [
  'src/routes/home.tsx react-router-framework',
  'src/routes/about.tsx react-router-framework',
  'src/routes/version.tsx react-router-framework',
];

const PAGE_SUITES = [
  'src/routes/home.test.tsx react-router-framework',
  'src/routes/about.test.tsx react-router-framework',
  'src/routes/version.test.tsx react-router-framework',
];

describe('isFrameworkMode', () => {
  it('is the framework router alone', () => {
    const framework = isFrameworkMode(answersFor(FRAMEWORK));
    const declarative = isFrameworkMode(answersFor({
      ...FRAMEWORK,
      router: 'react-router',
    }));

    expect(framework).toBe(true);
    expect(declarative).toBe(false);
  });
});

describe('frameworkRouteFiles', () => {
  it('writes nothing outside framework mode', () => {
    const declarative = pickedBy(frameworkRouteFiles(), {
      target: 'react',
      router: 'react-router',
      form: 'tanstack-form',
    });

    expect(declarative).toEqual([]);
  });

  it('routes the three pages without a form', () => {
    const files = pickedBy(frameworkRouteFiles(), FRAMEWORK);

    const expected = [...PAGES, 'src/routes.ts react-router-framework'];
    expect(files).toEqual(expected);
  });

  it.each(['tanstack-form', 'react-hook-form'] as const)('routes the contact page under %s', (form) => {
    const files = pickedBy(frameworkRouteFiles(), {
      ...FRAMEWORK,
      form,
    });

    const expected = [
      ...PAGES,
      'src/routes.ts with-form',
      'src/routes/contact.tsx react-router-framework',
    ];
    expect(files).toEqual(expected);
  });
});

describe('frameworkRouteTests', () => {
  it('writes nothing outside framework mode', () => {
    const declarative = pickedBy(frameworkRouteTests(), {
      target: 'react',
      router: 'react-router',
      form: 'tanstack-form',
    });

    expect(declarative).toEqual([]);
  });

  it('suites the route config without a form', () => {
    const suites = pickedBy(frameworkRouteTests(), FRAMEWORK);

    const expected = [...PAGE_SUITES, 'src/routes.test.ts react-router-framework'];
    expect(suites).toEqual(expected);
  });

  it('suites the contact route under a form', () => {
    const suites = pickedBy(frameworkRouteTests(), {
      ...FRAMEWORK,
      form: 'tanstack-form',
    });

    const expected = [
      ...PAGE_SUITES,
      'src/routes.test.ts with-form',
      'src/routes/contact.test.tsx react-router-framework',
    ];
    expect(suites).toEqual(expected);
  });

  it('covers each route module with its own suite', () => {
    const pairs = frameworkRouteTests()
      .map(({ target, covers }) => {
        return `${covers} ${target}`;
      });

    const expected = [
      'src/routes/home.tsx src/routes/home.test.tsx',
      'src/routes/about.tsx src/routes/about.test.tsx',
      'src/routes/version.tsx src/routes/version.test.tsx',
      'src/routes.ts src/routes.test.ts',
      'src/routes.ts src/routes.test.ts',
      'src/routes/contact.tsx src/routes/contact.test.tsx',
    ];
    expect(pairs).toEqual(expected);
  });
});
