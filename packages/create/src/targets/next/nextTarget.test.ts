import { walkStarters } from '@mocks/starterWalk';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { FOLDER_ROUTED } from '../constants';
import { componentNaming } from '../utils/namingUtils';

import { nextTarget } from './nextTarget';

describe('nextTarget', () => {
  it('is the record the next answer names', () => {
    expect(nextTarget.id).toBe('next');
  });

  // The App Router renders the document, so there is no `index.html` to write and none to lint.
  it('owns its document rather than writing one', () => {
    expect(nextTarget.html).toBe(false);
    expect(nextTarget.htmlEntry).toBeUndefined();
  });

  // Next owns the build, so there is no vite config for a plugin to go in.
  it('carries no vite build', () => {
    expect(nextTarget.vite).toBe(false);
    expect(nextTarget.build).toBe('next build');
  });

  it('names files the way any JSX target does', () => {
    expect(nextTarget.naming).toEqual(componentNaming('app'));
  });

  // The routes are the directory, so a route folder may be `[id]` or `(group)`.
  it('admits the route segments a file-based router owns', () => {
    expect(nextTarget.folderNaming).toEqual({ 'src/**/': FOLDER_ROUTED });
  });
});

/*
 * Every `when` on the record, over every answer set it can see. `starterSourceEmitter` refuses two spellings of
 * one destination, and a gate that never opens, or never shuts, decides nothing.
 */
describe('the starter gates', () => {
  const walked = walkStarters(() => {
    return nextTarget;
  }, 'next');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walked.twice).toEqual([]);
  });

  it('each open under some answer set and shut under another', () => {
    expect(walked.fixed).toEqual([]);
  });
});
