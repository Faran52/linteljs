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
    expect(hostedPartsFor('vue')).toBe(PARTS.vue);
    expect(hostedPartsFor(undefined)).toBeUndefined();
  });
});

describe('partsFor', () => {
  it('answers the parts of the framework it is asked for', () => {
    expect(partsFor('vue').sfcExtension).toBe('vue');
  });
});

describe('hostedNaming', () => {
  it('marks a component by the extension the framework uses and keeps the declaration key beside it', () => {
    expect(hostedNaming('react')).toEqual({
      'src/**/*.tsx': COMPONENT,
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      '**/utils/*.ts': '*Utils',
      'src/**/*.d.ts': DECLARATION,
    });
  });
});
