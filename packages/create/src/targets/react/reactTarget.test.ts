import {
  describe,
  expect,
  it,
} from 'vitest';

import { COMPONENT } from '../constants';

import { reactTarget } from './reactTarget';

describe('reactTarget', () => {
  it('is the record the react answer names', () => {
    expect(reactTarget.id).toBe('react');
  });

  // The only target with a `routers` slot, so it carries every router the vocabulary has.
  it('offers both routers', () => {
    expect(reactTarget.routers).toEqual(['react-router', 'tanstack-router']);
  });

  // A router replaces the scaffolder's entry, so each one needs its own copy of it rather than a shared file.
  it('ships one entry file per router it offers', () => {
    expect(reactTarget.starterFiles?.filter((file) => {
      return file.target === 'src/main.tsx';
    }).map((file) => {
      return file.router;
    })).toEqual(['react-router', 'tanstack-router']);
  });

  it('marks a .tsx file a component wherever it sits', () => {
    expect(reactTarget.naming['src/**/*.tsx']).toBe(COMPONENT);
  });
});
