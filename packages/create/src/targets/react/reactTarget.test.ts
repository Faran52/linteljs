import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Answers, DEFAULT_ANSWERS } from '@answers';

import { COMPONENT } from '../constants';

import { reactTarget } from './reactTarget';

const recordFor = (overrides: Partial<Answers> = {}): ReturnType<typeof reactTarget> => {
  return reactTarget({
    ...DEFAULT_ANSWERS,
    target: 'react',
    ...overrides,
  });
};

describe('reactTarget', () => {
  it('is the record the react answer names', () => {
    expect(recordFor().id).toBe('react');
  });

  it('offers both routers and the one mode', () => {
    expect(recordFor().routers).toEqual(['react-router', 'react-router-framework', 'tanstack-router']);
  });

  /*
   * Framework mode is an overlay rather than a record of its own, so what is worth pinning is the fields it moves:
   * React Router's CLI owns the build, and there is no `index.html` for it to own.
   */
  it('hands framework mode the build, and takes its document away', () => {
    const framework = recordFor({ router: 'react-router-framework' });

    expect(framework.build).toBe('react-router build');
    expect(framework.typecheck).toBe('react-router typegen && tsc --noEmit');
    expect(framework.htmlEntry).toBeUndefined();
    expect(recordFor({ router: 'react-router' }).htmlEntry).toBe('src/main.tsx');
  });

  /*
   * The entry is one file whatever was answered: it mounts `App`, and `App` is what a router replaces. Keeping the
   * router out of the entry is what stops it multiplying with the store, which also needs an ancestor.
   */
  it('ships one entry, and an App per router it offers plus one for no router', () => {
    expect(recordFor().starterFiles.filter((file) => {
      return file.target === 'src/main.tsx';
    })).toHaveLength(1);

    expect(recordFor().starterFiles.filter((file) => {
      return file.target === 'src/App.tsx';
    }).map((file) => {
      return file.variant;
    })).toEqual([undefined, 'react-router', 'tanstack-router']);
  });

  /*
   * The mocking layer is shared and framework-free, so what the record decides is only whether it is written and
   * which of the two handler spellings goes: the contact endpoint answers a page that exists only with a form.
   */
  it('ships the mocking layer only when msw was answered, and picks the handlers by whether a form was', () => {
    const sourcesFor = (overrides: Partial<Answers>): Record<string, string | undefined> => {
      const answers: Answers = {
        ...DEFAULT_ANSWERS,
        target: 'react',
        ...overrides,
      };

      return Object.fromEntries(recordFor(overrides).starterFiles.filter((file) => {
        return file.when === undefined || file.when(answers);
      }).map((file) => {
        return [file.target, file.variant];
      }));
    };

    expect(sourcesFor({})).not.toHaveProperty('__mocks__/msw/handlers.ts');
    expect(sourcesFor({ mocking: 'msw' })).toHaveProperty('src/lib/utils/fetchExtended.ts');
    expect(sourcesFor({ mocking: 'msw' })['__mocks__/msw/handlers.ts']).toBeUndefined();
    expect(sourcesFor({
      mocking: 'msw',
      form: 'tanstack-form',
    })['__mocks__/msw/handlers.ts']).toBe('with-form');
  });

  // The suite follows the file it covers, so the two spellings are picked the same way.
  it('picks the handler suite the same way the handlers are picked', () => {
    const suitesFor = (overrides: Partial<Answers>): Record<string, string | undefined> => {
      const answers: Answers = {
        ...DEFAULT_ANSWERS,
        target: 'react',
        ...overrides,
      };

      return Object.fromEntries(recordFor(overrides).starterTests.filter((test) => {
        return test.when === undefined || test.when(answers);
      }).map((test) => {
        return [test.target, test.variant];
      }));
    };

    expect(suitesFor({})).not.toHaveProperty('__mocks__/msw/handlers.test.ts');
    expect(suitesFor({ mocking: 'msw' })['__mocks__/msw/handlers.test.ts']).toBeUndefined();
    expect(suitesFor({ mocking: 'msw' })).toHaveProperty('src/lib/utils/fetchExtended.test.ts');
    expect(suitesFor({
      mocking: 'msw',
      form: 'tanstack-form',
    })['__mocks__/msw/handlers.test.ts']).toBe('with-form');
  });

  it('marks a .tsx file a component wherever it sits', () => {
    expect(recordFor().naming['src/**/*.tsx']).toBe(COMPONENT);
  });
});
