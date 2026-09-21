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
  // A host has no directory-based component rule to apply, so the extension is what marks one.
  it('marks a component by the extension the framework uses and keeps the declaration key beside it', () => {
    expect(hostedNaming('react')).toEqual({
      'src/**/*.tsx': COMPONENT,
      'src/**/!(*.d|*.test|*.spec).ts': 'CAMEL_CASE',
      'src/**/*.d.ts': DECLARATION,
    });
  });
});
