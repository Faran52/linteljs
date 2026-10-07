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
  rtkContactFiles,
  rtkContactTests,
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
    const actual = pickedBy(mockFiles(true));
    const expected = ['src/lib/utils/fetchExtendedUtils.ts base'];
    expect(actual).toEqual(expected);
  });

  it.each<[string, Partial<Answers>, string]>([
    [
      'no form',
      { mocking: 'msw' },
      'base',
    ],
    [
      'a form',
      {
        mocking: 'msw',
        form: 'tanstack-form',
      },
      'with-form',
    ],
  ])('writes the worker, the node server and the handlers for %s under msw', (_case, overrides, handlers) => {
    const actual = pickedBy(mockFiles(true), overrides);
    const expected = [
      'src/lib/utils/fetchExtendedUtils.ts base',
      '__mocks__/msw/node.ts base',
      '__mocks__/msw/browser.ts base',
      `__mocks__/msw/handlers.ts ${handlers}`,
    ];
    expect(actual).toEqual(expected);
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

    const expected = {
      target: 'src/lib/utils/fetch-extended-utils.ts',
      source: 'src/lib/utils/fetchExtendedUtils.ts',
      shared: true,
    };
    expect(files[0]).toEqual(expected);
  });
});

describe('mockTests', () => {
  it('ships no suite under __mocks__, whatever the mocking and form answers', () => {
    const answers: Partial<Answers> = {
      mocking: 'msw',
      form: 'tanstack-form',
    };

    const actual = pickedBy(mockTests(), answers);

    const expected = ['src/lib/utils/fetchExtendedUtils.test.ts base'];
    expect(actual).toEqual(expected);
  });

  it('names the suite after the adapter it covers, under the suffix it is given', () => {
    const plain = mockTests('src/lib/utils/fetch-extended-utils')[0];
    const spec = mockTests('src/lib/utils/fetch-extended-utils', 'spec')[0];

    const expected = {
      target: 'src/lib/utils/fetch-extended-utils.test.ts',
      covers: 'src/lib/utils/fetch-extended-utils.ts',
    };
    expect(plain).toMatchObject(expected);
    expect(spec?.target).toBe('src/lib/utils/fetch-extended-utils.spec.ts');
  });
});

describe('accessorFiles', () => {
  it('writes both accessors in their own kebab directory under tanstack query alone', () => {
    const actual = pickedBy(accessorFiles(HOOKS), { data: 'tanstack-query' });
    const expected = [
      'src/lib/hooks/use-extended-query/useExtendedQuery.ts tanstack-query',
      'src/lib/hooks/use-extended-mutation/useExtendedMutation.ts tanstack-query',
      'src/lib/utils/queryOptionsUtils.ts base',
    ];
    expect(actual).toEqual(expected);

    const rtkPicked = pickedBy(accessorFiles(HOOKS), { data: 'rtk-query' });
    expect(rtkPicked).toEqual([]);
  });

  it('reads another target\'s accessor where one is taken', () => {
    const files = accessorFiles({
      ...HOOKS,
      directory: 'src/hooks',
    }, {
      shared: 'react',
      names: HOOKS,
    })[0];

    const expected = {
      target: 'src/hooks/use-extended-query/useExtendedQuery.ts',
      variant: 'tanstack-query',
      shared: 'react',
      source: 'src/lib/hooks/use-extended-query/useExtendedQuery.ts',
    };
    expect(files).toMatchObject(expected);
  });

  it('writes the shared option builders under the target\'s own name, from the one source', () => {
    const builders = accessorFiles({
      ...HOOKS,
      optionsUtils: 'src/lib/utils/query-options-utils',
    })[2];

    const expected = {
      target: 'src/lib/utils/query-options-utils.ts',
      source: 'src/lib/utils/queryOptionsUtils.ts',
      shared: true,
    };
    expect(builders).toMatchObject(expected);
  });
});

describe('accessorTests', () => {
  it('puts each suite beside its accessor, covering it', () => {
    const expected = {
      target: 'src/lib/hooks/use-extended-query/useExtendedQuery.test.ts',
      covers: 'src/lib/hooks/use-extended-query/useExtendedQuery.ts',
      variant: 'tanstack-query',
    };
    expect(accessorTests(HOOKS)[0]).toMatchObject(expected);
  });

  it('names a suite with the target\'s own suffix', () => {
    const tests = accessorTests({
      directory: 'src/lib/services',
      query: 'extended-query',
      mutation: 'extended-mutation',
      testSuffix: '.spec.ts',
      optionsUtils: 'src/lib/utils/query-options-utils',
    });

    const expected = [
      {
        target: 'src/lib/services/extended-query/extended-query.spec.ts',
      },
      {
        target: 'src/lib/services/extended-mutation/extended-mutation.spec.ts',
        covers: 'src/lib/services/extended-mutation/extended-mutation.ts',
      },
      {
        target: 'src/lib/utils/query-options-utils.spec.ts',
        covers: 'src/lib/utils/query-options-utils.ts',
        source: 'src/lib/utils/queryOptionsUtils.test.ts',
      },
    ];
    expect(tests).toMatchObject(expected);
  });

  it('reads another target\'s suite where one is taken', () => {
    const tests = accessorTests({
      ...HOOKS,
      directory: 'src/hooks',
    }, {
      shared: 'react',
      names: HOOKS,
    });

    const expected = [
      {
        target: 'src/hooks/use-extended-query/useExtendedQuery.test.ts',
        covers: 'src/hooks/use-extended-query/useExtendedQuery.ts',
        shared: 'react',
        source: 'src/lib/hooks/use-extended-query/useExtendedQuery.test.ts',
      },
      {
        target: 'src/hooks/use-extended-mutation/useExtendedMutation.test.ts',
        covers: 'src/hooks/use-extended-mutation/useExtendedMutation.ts',
        shared: 'react',
        source: 'src/lib/hooks/use-extended-mutation/useExtendedMutation.test.ts',
      },
      {
        target: 'src/lib/utils/queryOptionsUtils.test.ts',
        covers: 'src/lib/utils/queryOptionsUtils.ts',
        shared: true,
        source: 'src/lib/utils/queryOptionsUtils.test.ts',
      },
    ];
    expect(tests).toMatchObject(expected);
  });

  it('writes both suites under tanstack query alone', () => {
    const actual = pickedBy(accessorTests(HOOKS), { data: 'tanstack-query' });
    expect(actual).toHaveLength(3);
    const unanswered = pickedBy(accessorTests(HOOKS));
    expect(unanswered).toEqual([]);
  });
});

describe('the rtk query api', () => {
  it('writes the base api and its suite under rtk query alone', () => {
    const actual = pickedBy([...rtkFiles(), ...rtkTests()], { data: 'rtk-query' });
    const expected = [
      'src/lib/apis/base/baseApi.ts rtk-query',
      'src/lib/apis/base/baseApi.test.ts rtk-query',
    ];
    expect(actual).toEqual(expected);

    const tanstackPicked = pickedBy([...rtkFiles(), ...rtkTests()], { data: 'tanstack-query' });
    expect(tanstackPicked).toEqual([]);
  });
});

describe('the rtk query contact api', () => {
  it('writes the endpoints, the hooks and their barrel under a form with rtk query alone', () => {
    const withForm = pickedBy(rtkContactFiles(), {
      form: 'tanstack-form',
      data: 'rtk-query',
    });

    const expected = [
      'src/lib/apis/contact/index.ts rtk-query',
      'src/lib/apis/contact/contactEndpoints.ts rtk-query',
      'src/lib/apis/contact/contactHooks.ts rtk-query',
    ];
    expect(withForm).toEqual(expected);

    const actual = pickedBy(rtkContactFiles(), { data: 'rtk-query' });
    expect(actual).toEqual([]);
    const formOnly = pickedBy(rtkContactFiles(), { form: 'tanstack-form' });
    expect(formOnly).toEqual([]);
  });

  it('takes both from the react tree, a suite each', () => {
    const tests = rtkContactTests()
      .map(({
        target,
        covers,
        shared,
      }) => {
        return `${target} ${covers} ${String(shared)}`;
      });

    const expected = [
      'src/lib/apis/contact/contactEndpoints.test.ts src/lib/apis/contact/contactEndpoints.ts react',
      'src/lib/apis/contact/contactHooks.test.ts src/lib/apis/contact/contactHooks.ts react',
    ];
    expect(tests).toEqual(expected);
  });
});
