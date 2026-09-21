import {
  describe,
  expect,
  it,
} from 'vitest';

import { FOLDER_ROUTED } from '../constants';
import { componentNaming } from '../utils/namingUtils';

import { solidTarget } from './solidTarget';

describe('solidTarget', () => {
  it('is the record the solid answer names', () => {
    expect(solidTarget.id).toBe('solid');
  });

  // Its own layer, rather than React's, though both compile `.tsx`.
  it('takes the solid framework layer', () => {
    expect(solidTarget.framework).toBe('solid');
  });

  it('names files the way any JSX target does', () => {
    expect(solidTarget.naming).toEqual(componentNaming());
  });

  // Solid has a file-based router, so a route directory may be `[id]` or `(group)`.
  it('admits the route segments a file-based router owns', () => {
    expect(solidTarget.folderNaming).toEqual({ 'src/**/': FOLDER_ROUTED });
  });
});
