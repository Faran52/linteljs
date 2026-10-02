import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  COMPONENT,
  DECLARATION,
  PARTS,
} from '../constants';

import {
  hostedNaming,
  hostedPartsFor,
  partsFor,
} from './frameworkUtils';

describe('hostedPartsFor', () => {
  it('answers the parts of a hosted framework, and none where nothing is hosted', () => {
    const hostedParts = hostedPartsFor('vue');
    expect(hostedParts).toBe(PARTS.vue);
    const undefinedHostedParts = hostedPartsFor(undefined);
    expect(undefinedHostedParts).toBeUndefined();
  });
});

describe('partsFor', () => {
  it('answers the parts of the framework it is asked for', () => {
    expect(partsFor('vue').sfcExtension).toBe('vue');
  });
});

describe('hostedNaming', () => {
  it('marks a component by the extension the framework uses and keeps the declaration key beside it', () => {
    const actual = hostedNaming('react');
    const expected = {
      'src/**/*.tsx': COMPONENT,
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      '**/utils/*.ts': '*Utils',
      'src/**/*.d.ts': DECLARATION,
    };
    expect(actual).toEqual(expected);
  });
});
