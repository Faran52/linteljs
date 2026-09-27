import {
  describe,
  expect,
  it,
} from 'vitest';

import { COMPONENT, DECLARATION } from '../constants';

import { hostedNaming, partsFor } from './frameworkUtils';

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
      'src/**/*.d.ts': DECLARATION,
    });
  });
});
