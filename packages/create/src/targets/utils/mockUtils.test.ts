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
  it('writes the adapter alone without msw', () => {
    expect(pickedBy(mockFiles(true))).toEqual(['src/lib/utils/fetchExtendedUtils.ts base']);
  });

  it.each<[string, Partial<Answers>, string]>([
    ['no form', { mocking: 'msw' }, 'base'],
    ['a form', {
      mocking: 'msw',
      form: 'tanstack-form',
    }, 'with-form'],
  ])('writes the worker, the node server and the handlers for %s under msw', (_case, overrides, handlers) => {
    expect(pickedBy(mockFiles(true), overrides)).toEqual([
      'src/lib/utils/fetchExtendedUtils.ts base',
      '__mocks__/msw/node.ts base',
      '__mocks__/msw/browser.ts base',
      `__mocks__/msw/handlers.ts ${handlers}`,
    ]);
  });

  it('writes the bare handlers under a form where the target writes no contact page', () => {
    const files = mockFiles(false);

    const picked = pickedBy(files, {
      mocking: 'msw',
      form: 'tanstack-form',
    });

    expect(picked).toContain('__mocks__/msw/handlers.ts base');

    const withForm = files
      .filter(({ variant }) => {
        return variant === 'with-form';
      });

    expect(withForm).toEqual([]);
  });

  it('leaves the browser worker out for a target that serves none, and lands the adapter where it is asked', () => {
    const files = mockFiles(true, false, 'src/lib/utils/fetch-extended-utils.ts');

    const targets = files
      .map(({ target }) => {
        return target;
      });

    expect(targets).not.toContain('__mocks__/msw/browser.ts');
    expect(files[0]).toEqual({
      target: 'src/lib/utils/fetch-extended-utils.ts',
      source: 'src/lib/utils/fetchExtendedUtils.ts',
      shared: true,
    });
  });
});

describe('mockTests', () => {
  it.each<[string, Partial<Answers>, string[]]>([
    ['no mocking', {}, ['src/lib/utils/fetchExtendedUtils.test.ts base']],
    ['msw and no form', { mocking: 'msw' }, [
      'src/lib/utils/fetchExtendedUtils.test.ts base',
      '__mocks__/msw/handlers.test.ts base',
    ]],
    ['msw and a form', {
      mocking: 'msw',
      form: 'tanstack-form',
    }, [
      'src/lib/utils/fetchExtendedUtils.test.ts base',
      '__mocks__/msw/handlers.test.ts with-form',
    ]],
  ])('follows the files it covers under %s', (_case, overrides, picked) => {
    expect(pickedBy(mockTests(true), overrides)).toEqual(picked);
  });

  it('covers the bare handlers under a form where the target writes no contact page', () => {
    const tests = mockTests(false);

    const picked = pickedBy(tests, {
      mocking: 'msw',
      form: 'tanstack-form',
    });

    expect(picked).toContain('__mocks__/msw/handlers.test.ts base');

    const withForm = tests
      .filter(({ variant }) => {
        return variant === 'with-form';
      });

    expect(withForm).toEqual([]);
  });

  it('names the suite after the adapter it covers', () => {
    expect(mockTests(true, 'src/lib/utils/fetch-extended-utils')[0]).toMatchObject({
      target: 'src/lib/utils/fetch-extended-utils.test.ts',
      covers: 'src/lib/utils/fetch-extended-utils.ts',
    });
  });
});

describe('accessorFiles', () => {
  it('writes both accessors in their own kebab directory under tanstack query alone', () => {
    expect(pickedBy(accessorFiles(HOOKS), { data: 'tanstack-query' })).toEqual([
      'src/lib/hooks/use-extended-query/useExtendedQuery.ts tanstack-query',
      'src/lib/hooks/use-extended-mutation/useExtendedMutation.ts tanstack-query',
    ]);
    expect(pickedBy(accessorFiles(HOOKS), { data: 'rtk-query' })).toEqual([]);
  });

  it('reads another target\'s accessor where one is taken', () => {
    const files = accessorFiles({
      ...HOOKS,
      directory: 'src/hooks',
    }, {
      shared: 'react',
      names: HOOKS,
    })[0];

    expect(files).toMatchObject({
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

  it('names a suite with the target\'s own suffix', () => {
    const tests = accessorTests({
      directory: 'src/lib/services',
      query: 'extended-query',
      mutation: 'extended-mutation',
      testSuffix: '.spec.ts',
    })[1];

    expect(tests).toMatchObject({
      target: 'src/lib/services/extended-mutation/extended-mutation.spec.ts',
      covers: 'src/lib/services/extended-mutation/extended-mutation.ts',
    });
  });

  it('reads another target\'s suite where one is taken', () => {
    const tests = accessorTests({
      ...HOOKS,
      directory: 'src/hooks',
    }, {
      shared: 'react',
      names: HOOKS,
    });

    expect(tests).toMatchObject([{
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
      'src/lib/apis/base/baseApi.ts rtk-query',
      'src/lib/apis/base/baseApi.test.ts rtk-query',
    ]);
    expect(pickedBy([...rtkFiles(), ...rtkTests()], { data: 'tanstack-query' })).toEqual([]);
  });
});
