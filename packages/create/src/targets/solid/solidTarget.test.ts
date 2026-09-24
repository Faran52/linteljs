import { walkStarters } from '@mocks/starterWalk';
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

/*
 * Every `when` on the record, over every answer set it can see. `starterSourceEmitter` refuses two spellings of
 * one destination, and a gate that never opens, or never shuts, decides nothing.
 */
describe('the starter gates', () => {
  const walked = walkStarters(() => {
    return solidTarget;
  }, 'solid');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walked.twice).toEqual([]);
  });

  it('each open under some answer set and shut under another', () => {
    expect(walked.fixed).toEqual([]);
  });
});
