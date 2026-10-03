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

    const expected = ['src/lib/apis/contact/index.ts base', 'src/lib/apis/contact/contactApi.ts base'];
    expect(actual).toEqual(expected);
  });

  it('swaps the wrapper for the TanStack Query one with that data layer', () => {
    const actual = pickedBy(contactApiFiles(), {
      form: 'tanstack-form',
      data: 'tanstack-query',
    });

    const expected = ['src/lib/apis/contact/index.ts base', 'src/lib/apis/contact/contactApi.ts tanstack-query'];
    expect(actual).toEqual(expected);
  });

  it('reads the barrel and the plain wrapper from the shared tree, the TanStack one from the target', () => {
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
});

describe('contactSchemaFiles', () => {
  it('writes nothing without a form', () => {
    const actual = pickedBy(contactSchemaFiles(), { libraries: ['zod'] });

    expect(actual).toEqual([]);
  });

  it('writes the plain schema with a form, and the zod one with zod', () => {
    const plain = pickedBy(contactSchemaFiles(), { form: 'tanstack-form' });
    const zod = pickedBy(contactSchemaFiles(), {
      form: 'tanstack-form',
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

    const expected = [true, true];
    expect(shared).toEqual(expected);
  });
});
