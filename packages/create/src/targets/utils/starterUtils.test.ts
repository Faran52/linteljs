import { pickedBy } from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { always, hasForm } from './gateUtils';
import {
  contactApiFiles,
  contactFormFiles,
  contactFormTest,
  contactSubmitFiles,
  contactSubmitTests,
  filesAt,
  mocked,
  variantOf,
} from './starterUtils';

import type { Answers } from '@config/types';
import type { StarterFile } from '../types';

describe('filesAt', () => {
  it('makes a bare file of each path when given no fields', () => {
    const actual = filesAt(['src/a.ts', 'src/b.ts']);

    const expected = [{ target: 'src/a.ts' }, { target: 'src/b.ts' }];
    expect(actual).toStrictEqual(expected);
  });

  it('gives every path the same fields', () => {
    const actual = filesAt(['src/a.ts', 'src/b.ts'], {
      variant: 'i18n',
      shared: 'react',
    });

    const expected = [
      {
        target: 'src/a.ts',
        variant: 'i18n',
        shared: 'react',
      },
      {
        target: 'src/b.ts',
        variant: 'i18n',
        shared: 'react',
      },
    ];
    expect(actual).toStrictEqual(expected);
  });
});

describe('variantOf', () => {
  it.each<[StarterFile, string]>([
    [{ target: 'src/a.ts' }, 'msw'],
    [{ target: 'src/a.ts', variant: 'with-form' }, 'with-form-msw'],
  ])('names the variant of %o', (file, expected) => {
    const actual = variantOf(file, 'msw');

    expect(actual).toBe(expected);
  });
});

describe('mocked', () => {
  it.each<[Partial<Answers>, string[]]>([
    [{ form: 'tanstack-form' }, ['src/a.ts with-form']],
    [{ form: 'tanstack-form', mocking: 'msw' }, ['src/a.ts with-form-msw']],
    [{ mocking: 'msw' }, []],
  ])('writes the file or its msw twin, under its own condition, given %o', (overrides, expected) => {
    const files = mocked({
      target: 'src/a.ts',
      when: hasForm,
      variant: 'with-form',
    });

    const actual = pickedBy(files, overrides);

    expect(actual).toEqual(expected);
  });
});

describe('contactApiFiles', () => {
  it('writes nothing without a form', () => {
    const actual = pickedBy(contactApiFiles());

    expect(actual).toEqual([]);
  });

  it('writes the barrel and the plain wrapper with a form alone', () => {
    const actual = pickedBy(contactApiFiles(), { form: 'tanstack-form' });

    const expected = [
      'src/lib/apis/contact/index.ts base',
      'src/lib/apis/contact/contactApi.ts base',
    ];
    expect(actual).toEqual(expected);
  });

  it('swaps the wrapper for the TanStack Query one with that data layer', () => {
    const actual = pickedBy(contactApiFiles(), {
      form: 'tanstack-form',
      data: 'tanstack-query',
    });

    const expected = [
      'src/lib/apis/contact/index.ts base',
      'src/lib/apis/contact/contactApi.ts tanstack-query',
    ];
    expect(actual).toEqual(expected);
  });

  it('reads all but the TanStack wrapper from the shared tree, that one from the target', () => {
    const shared = contactApiFiles()
      .map(({ shared: tree }) => {
        return tree;
      });

    const expected = [
      true,
      true,
      undefined,
    ];
    expect(shared).toEqual(expected);
  });

  it('reads both wrappers from the named tree, the barrel still from the shared one', () => {
    const shared = contactApiFiles({ shared: 'react' })
      .map(({ shared: tree }) => {
        return tree;
      });

    const expected = [
      true,
      'react',
      'react',
    ];
    expect(shared).toStrictEqual(expected);
  });

  it('reads the barrel from the tree named for it', () => {
    const shared = contactApiFiles({
      shared: 'solid',
      barrel: 'solid',
    })
      .map(({ shared: tree }) => {
        return tree;
      });

    const expected = [
      'solid',
      'solid',
      'solid',
    ];
    expect(shared).toStrictEqual(expected);
  });

  it('writes nothing with RTK Query, which keeps its own barrel', () => {
    const rtk = {
      form: 'tanstack-form',
      store: 'redux-toolkit',
      data: 'rtk-query',
    } as const;

    const picked = pickedBy(contactApiFiles(), rtk);

    expect(picked).toEqual([]);
  });
});

describe('contactFormFiles', () => {
  it('writes nothing without a form', () => {
    const actual = pickedBy(contactFormFiles(), { libraries: ['zod'] });

    expect(actual).toEqual([]);
  });

  it('writes the plain service with a form, and the zod one with zod, each beside the local submit', () => {
    const plain = pickedBy(contactFormFiles(), { form: 'react-hook-form' });
    const zod = pickedBy(contactFormFiles(), {
      form: 'tanstack-form',
      libraries: ['zod'],
    });

    const expected = [
      'src/lib/services/contact-form/contactFormService.ts base',
      'src/lib/services/contact-submit/contactSubmitService.ts base',
    ];
    expect(plain).toEqual(expected);
    const zodService = [
      'src/lib/services/contact-form/contactFormService.ts zod',
      'src/lib/services/contact-submit/contactSubmitService.ts base',
    ];
    expect(zod).toEqual(zodService);
  });

  it('reads each from the shared tree', () => {
    const shared = contactFormFiles()
      .map(({ shared: tree }) => {
        return tree;
      });

    const expected = [
      true,
      true,
      true,
      true,
    ];
    expect(shared).toEqual(expected);
  });
});

describe('contactSubmitFiles', () => {
  it.each<[string, Partial<Answers>, string[]]>([
    [
      'no form',
      { mocking: 'msw' },
      [],
    ],
    [
      'a form',
      { form: 'react-hook-form' },
      ['src/lib/services/contact-submit/contactSubmitService.ts base'],
    ],
    [
      'a form under msw',
      {
        form: 'react-hook-form',
        mocking: 'msw',
      },
      ['src/lib/services/contact-submit/contactSubmitService.ts msw'],
    ],
  ])('writes the submit that fits %s', (_case, overrides, expected) => {
    const actual = pickedBy(contactSubmitFiles(), overrides);

    expect(actual).toEqual(expected);
  });

  it('writes under the stem it is given, from the shared source, wherever the target always has a contact page', () => {
    const files = contactSubmitFiles('src/lib/services/contact-submit/contact-submit-service', always);
    const picked = pickedBy(files, { mocking: 'msw' });

    const expected = ['src/lib/services/contact-submit/contact-submit-service.ts msw'];
    expect(picked).toEqual(expected);
    const sources = files
      .map(({ source, shared }) => {
        return `${String(source)} ${String(shared)}`;
      });
    const expectedSources = [
      'src/lib/services/contact-submit/contactSubmitService.ts true',
      'src/lib/services/contact-submit/contactSubmitService.ts true',
    ];
    expect(sources).toEqual(expectedSources);
  });
});

describe('contactSubmitTests', () => {
  it.each<[string, Partial<Answers>, string]>([
    [
      'without msw',
      {},
      'base',
    ],
    [
      'under msw',
      { mocking: 'msw' },
      'msw',
    ],
  ])('picks the suite %s', (_case, overrides, variant) => {
    const actual = pickedBy(contactSubmitTests(), overrides);

    const expected = [`src/lib/services/contact-submit/contactSubmitService.test.ts ${variant}`];
    expect(actual).toEqual(expected);
  });

  it('names each suite under the stem and suffix it is given, from the shared source', () => {
    const tests = contactSubmitTests('src/lib/services/contact-submit/contact-submit-service', 'spec')
      .map(({
        target,
        covers,
        source,
        shared,
      }) => {
        return `${target} ${covers} ${String(source)} ${String(shared)}`;
      });

    const line = [
      'src/lib/services/contact-submit/contact-submit-service.spec.ts',
      'src/lib/services/contact-submit/contact-submit-service.ts',
      'src/lib/services/contact-submit/contactSubmitService.test.ts',
      'true',
    ].join(' ');
    expect(tests).toEqual([line, line]);
  });
});

describe('contactFormTest', () => {
  it('names the shared suite under the stem and suffix it is given', () => {
    const plain = contactFormTest();
    const spec = contactFormTest('src/lib/services/contact-form/contact-form-service', 'spec');

    const expected = {
      target: 'src/lib/services/contact-form/contactFormService.test.ts',
      covers: 'src/lib/services/contact-form/contactFormService.ts',
      source: 'src/lib/services/contact-form/contactFormService.test.ts',
      shared: true,
    };
    expect(plain).toStrictEqual(expected);
    const expectedSpec = {
      target: 'src/lib/services/contact-form/contact-form-service.spec.ts',
      covers: 'src/lib/services/contact-form/contact-form-service.ts',
      source: 'src/lib/services/contact-form/contactFormService.test.ts',
    };
    expect(spec).toMatchObject(expectedSpec);
  });
});
