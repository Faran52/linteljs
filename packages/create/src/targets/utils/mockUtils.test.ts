import { pickedBy } from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  accessorFiles,
  type AccessorNames,
  accessorTests,
  mockFiles,
  mockTests,
  rtkFiles,
  rtkTests,
} from './mockUtils';

import type { Answers } from '@config/types';

const HOOKS: AccessorNames = {
  directory: 'src/lib/hooks',
  query: 'useExtendedQuery',
  mutation: 'useExtendedMutation',
  testSuffix: '.test.ts',
};

describe('mockFiles', () => {
  // Every project speaks HTTP through one adapter, whether or not it answered a mocking layer.
  it('writes the adapter alone without msw', () => {
    expect(pickedBy(mockFiles(true))).toEqual(['src/lib/utils/fetchExtended.ts base']);
  });

  // The contact handler answers a page only a form writes, so the handlers follow the form answer.
  it.each<[string, Partial<Answers>, string]>([
    ['no form', { mocking: 'msw' }, 'base'],
    ['a form', {
      mocking: 'msw',
      form: 'tanstack-form',
    }, 'with-form'],
  ])('writes the worker, the node server and the handlers for %s under msw', (_case, overrides, handlers) => {
    expect(pickedBy(mockFiles(true), overrides)).toEqual([
      'src/lib/utils/fetchExtended.ts base',
      '__mocks__/msw/node.ts base',
      '__mocks__/msw/browser.ts base',
      `__mocks__/msw/handlers.ts ${handlers}`,
    ]);
  });

  /*
   * A form on a target that writes no contact page: the with-form handlers import its schemas, so the bare pair is
   * written, and no with-form entry is carried that no answer could reach.
   */
  it('writes the bare handlers under a form where the target writes no contact page', () => {
    const files = mockFiles(false);

    expect(pickedBy(files, {
      mocking: 'msw',
      form: 'tanstack-form',
    })).toContain('__mocks__/msw/handlers.ts base');
    expect(files.filter(({ variant }) => {
      return variant === 'with-form';
    })).toEqual([]);
  });

  // React Native has no dev server to serve a worker from, so it carries no entry for one at all.
  it('leaves the browser worker out for a target that serves none, and lands the adapter where it is asked', () => {
    const files = mockFiles(true, false, 'src/lib/utils/fetch-extended.ts');

    expect(files.map(({ target }) => {
      return target;
    })).not.toContain('__mocks__/msw/browser.ts');
    expect(files[0]).toEqual({
      target: 'src/lib/utils/fetch-extended.ts',
      source: 'src/lib/utils/fetchExtended.ts',
      shared: true,
    });
  });
});

describe('mockTests', () => {
  it.each<[string, Partial<Answers>, string[]]>([
    ['no mocking', {}, ['src/lib/utils/fetchExtended.test.ts base']],
    ['msw and no form', { mocking: 'msw' }, [
      'src/lib/utils/fetchExtended.test.ts base',
      '__mocks__/msw/handlers.test.ts base',
    ]],
    ['msw and a form', {
      mocking: 'msw',
      form: 'tanstack-form',
    }, [
      'src/lib/utils/fetchExtended.test.ts base',
      '__mocks__/msw/handlers.test.ts with-form',
    ]],
  ])('follows the files it covers under %s', (_case, overrides, picked) => {
    expect(pickedBy(mockTests(true), overrides)).toEqual(picked);
  });

  it('covers the bare handlers under a form where the target writes no contact page', () => {
    const tests = mockTests(false);

    expect(pickedBy(tests, {
      mocking: 'msw',
      form: 'tanstack-form',
    })).toContain('__mocks__/msw/handlers.test.ts base');
    expect(tests.filter(({ variant }) => {
      return variant === 'with-form';
    })).toEqual([]);
  });

  it('names the suite after the adapter it covers', () => {
    expect(mockTests(true, 'src/lib/utils/fetch-extended')[0]).toMatchObject({
      target: 'src/lib/utils/fetch-extended.test.ts',
      covers: 'src/lib/utils/fetch-extended.ts',
    });
  });
});

describe('accessorFiles', () => {
  // Only TanStack Query is wrapped: RTK Query generates its own hooks, and no data layer has nothing to wrap.
  it('writes both accessors in their own kebab directory under tanstack query alone', () => {
    expect(pickedBy(accessorFiles(HOOKS), { data: 'tanstack-query' })).toEqual([
      'src/lib/hooks/use-extended-query/useExtendedQuery.ts tanstack-query',
      'src/lib/hooks/use-extended-mutation/useExtendedMutation.ts tanstack-query',
    ]);
    expect(pickedBy(accessorFiles(HOOKS), { data: 'rtk-query' })).toEqual([]);
  });

  // React Native takes React's bytes into its own directory, which is what `source` records.
  it('reads another target\'s accessor where one is taken', () => {
    expect(accessorFiles({
      ...HOOKS,
      directory: 'src/hooks',
    }, {
      shared: 'react',
      names: HOOKS,
    })[0]).toMatchObject({
      target: 'src/hooks/use-extended-query/useExtendedQuery.ts',
      variant: 'tanstack-query',
      shared: 'react',
      source: 'src/lib/hooks/use-extended-query/useExtendedQuery.ts',
    });
  });
});

describe('accessorTests', () => {
  it('puts each suite beside its accessor, covering it', () => {
    expect(accessorTests(HOOKS)[0]).toMatchObject({
      target: 'src/lib/hooks/use-extended-query/useExtendedQuery.test.ts',
      covers: 'src/lib/hooks/use-extended-query/useExtendedQuery.ts',
      variant: 'tanstack-query',
    });
  });

  // Angular names its suites `.spec.ts` and its files in kebab.
  it('names a suite with the target\'s own suffix', () => {
    expect(accessorTests({
      directory: 'src/lib/services',
      query: 'extended-query',
      mutation: 'extended-mutation',
      testSuffix: '.spec.ts',
    })[1]).toMatchObject({
      target: 'src/lib/services/extended-mutation/extended-mutation.spec.ts',
      covers: 'src/lib/services/extended-mutation/extended-mutation.ts',
    });
  });

  // React Native takes React's suites into its own directory, as it takes the accessors they cover.
  it('reads another target\'s suite where one is taken', () => {
    expect(accessorTests({
      ...HOOKS,
      directory: 'src/hooks',
    }, {
      shared: 'react',
      names: HOOKS,
    })).toMatchObject([{
      target: 'src/hooks/use-extended-query/useExtendedQuery.test.ts',
      covers: 'src/hooks/use-extended-query/useExtendedQuery.ts',
      shared: 'react',
      source: 'src/lib/hooks/use-extended-query/useExtendedQuery.test.ts',
    }, {
      target: 'src/hooks/use-extended-mutation/useExtendedMutation.test.ts',
      covers: 'src/hooks/use-extended-mutation/useExtendedMutation.ts',
      shared: 'react',
      source: 'src/lib/hooks/use-extended-mutation/useExtendedMutation.test.ts',
    }]);
  });

  it('writes both suites under tanstack query alone', () => {
    expect(pickedBy(accessorTests(HOOKS), { data: 'tanstack-query' })).toHaveLength(2);
    expect(pickedBy(accessorTests(HOOKS))).toEqual([]);
  });
});

describe('the rtk query api', () => {
  it('writes the base api and its suite under rtk query alone', () => {
    expect(pickedBy([...rtkFiles(), ...rtkTests()], { data: 'rtk-query' })).toEqual([
      'src/lib/apis/baseApi.ts rtk-query',
      'src/lib/apis/baseApi.test.ts rtk-query',
    ]);
    expect(pickedBy([...rtkFiles(), ...rtkTests()], { data: 'tanstack-query' })).toEqual([]);
  });
});
