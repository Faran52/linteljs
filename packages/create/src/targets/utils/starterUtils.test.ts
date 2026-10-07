import { pickedBy } from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  contactApiFiles,
  contactFormFiles,
  contactFormTest,
  filesAt,
} from './starterUtils';

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

  it('writes the plain service with a form, and the zod one with zod', () => {
    const plain = pickedBy(contactFormFiles(), { form: 'react-hook-form' });
    const zod = pickedBy(contactFormFiles(), {
      form: 'tanstack-form',
      libraries: ['zod'],
    });

    const expected = ['src/lib/services/contact-form/contactFormService.ts base'];
    expect(plain).toEqual(expected);
    const zodService = ['src/lib/services/contact-form/contactFormService.ts zod'];
    expect(zod).toEqual(zodService);
  });

  it('reads both from the shared tree', () => {
    const shared = contactFormFiles()
      .map(({ shared: tree }) => {
        return tree;
      });

    const expected = [true, true];
    expect(shared).toEqual(expected);
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
