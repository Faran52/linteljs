import { pickedBy } from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  contactApiFiles,
  contactSchemaFiles,
  filesAt,
  formValidatorFile,
  formValidatorTest,
  submissionTest,
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

  it('writes the barrel, the plain wrapper and the submission with a form alone', () => {
    const actual = pickedBy(contactApiFiles(), { form: 'tanstack-form' });

    const expected = [
      'src/lib/apis/contact/index.ts base',
      'src/lib/apis/contact/contactApi.ts base',
      'src/lib/apis/contact/submission.ts base',
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
      'src/lib/apis/contact/submission.ts base',
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
      true,
    ];
    expect(shared).toEqual(expected);
  });

  it('reads both wrappers from the named tree, the barrel and the submission still from the shared one', () => {
    const shared = contactApiFiles({ shared: 'react' })
      .map(({ shared: tree }) => {
        return tree;
      });

    const expected = [
      true,
      'react',
      'react',
      true,
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

describe('contactSchemaFiles', () => {
  it('writes nothing without a form', () => {
    const actual = pickedBy(contactSchemaFiles(), { libraries: ['zod'] });

    expect(actual).toEqual([]);
  });

  it('writes the plain schema with a form, and the zod one with zod', () => {
    const plain = pickedBy(contactSchemaFiles(), { form: 'react-hook-form' });
    const zod = pickedBy(contactSchemaFiles(), {
      form: 'react-hook-form',
      libraries: ['zod'],
    });

    const expected = ['src/lib/apis/contact/schemas.ts base'];
    expect(plain).toEqual(expected);
    const zodSchema = ['src/lib/apis/contact/schemas.ts zod'];
    expect(zod).toEqual(zodSchema);
  });

  it('reads both from the shared tree', () => {
    const shared = contactSchemaFiles()
      .map(({ shared: tree }) => {
        return tree;
      });

    const expected = [
      true,
      true,
      true,
    ];
    expect(shared).toEqual(expected);
  });

  it('adds the form validator with TanStack Form', () => {
    const actual = pickedBy(contactSchemaFiles(), { form: 'tanstack-form' });

    const expected = ['src/lib/apis/contact/schemas.ts base', 'src/lib/apis/contact/formValidator.ts base'];
    expect(actual).toEqual(expected);
  });
});

describe('formValidatorFile', () => {
  it('lands the shared validator under the stem it is given', () => {
    const file = formValidatorFile('src/lib/apis/contact/form-validator');

    const expected = {
      target: 'src/lib/apis/contact/form-validator.ts',
      source: 'src/lib/apis/contact/formValidator.ts',
      shared: true,
    };
    expect(file).toMatchObject(expected);
  });
});

describe('formValidatorTest', () => {
  it('names the shared suite under the stem and suffix it is given', () => {
    const plain = formValidatorTest();
    const spec = formValidatorTest('src/lib/apis/contact/form-validator', 'spec');

    const expected = {
      target: 'src/lib/apis/contact/formValidator.test.ts',
      covers: 'src/lib/apis/contact/formValidator.ts',
      source: 'src/lib/apis/contact/formValidator.test.ts',
      shared: true,
    };
    expect(plain).toStrictEqual(expected);
    const expectedSpec = {
      target: 'src/lib/apis/contact/form-validator.spec.ts',
      covers: 'src/lib/apis/contact/form-validator.ts',
    };
    expect(spec).toMatchObject(expectedSpec);
  });
});

describe('submissionTest', () => {
  it('suffixes the shared suite as the target names its tests', () => {
    const plain = submissionTest();
    const spec = submissionTest('spec');

    const expected = {
      target: 'src/lib/apis/contact/submission.test.ts',
      covers: 'src/lib/apis/contact/submission.ts',
      source: 'src/lib/apis/contact/submission.test.ts',
      shared: true,
    };
    expect(plain).toStrictEqual(expected);
    expect(spec.target).toBe('src/lib/apis/contact/submission.spec.ts');
  });
});
