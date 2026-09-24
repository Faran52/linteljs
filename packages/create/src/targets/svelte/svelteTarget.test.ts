import { walkStarters } from '@mocks/starterWalk';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { FOLDER_ROUTED } from '../constants';
import { sfcNaming } from '../utils/namingUtils';

import { svelteTarget } from './svelteTarget';

describe('svelteTarget', () => {
  it('is the record the svelte answer names', () => {
    expect(svelteTarget.id).toBe('svelte');
  });

  /*
   * SvelteKit loads no global stylesheet by convention, so the root layout importing `../app.css` is the only
   * thing that makes the stylesheet this CLI writes reach the browser. Without it Tailwind is installed,
   * configured, and generating nothing.
   */
  it('names the style entry the root layout imports', () => {
    expect(svelteTarget.styleEntry).toBe('src/app.css');
  });

  // `src/app.html` is SvelteKit's own shell, so there is no `index.html` for this CLI to write.
  it('writes no html entry of its own', () => {
    expect(svelteTarget.htmlEntry).toBeUndefined();
  });

  it('names files the way any SFC target does', () => {
    expect(svelteTarget.naming).toEqual(sfcNaming('svelte', 'routes'));
  });

  // SvelteKit's routes are the directory, so a route folder may be `[id]` or `(group)`.
  it('admits the route segments a file-based router owns', () => {
    expect(svelteTarget.folderNaming).toEqual({ 'src/**/': FOLDER_ROUTED });
  });
});

/*
 * Every `when` on the record, over every answer set it can see. `starterSourceEmitter` refuses two spellings of
 * one destination, and a gate that never opens, or never shuts, decides nothing.
 */
describe('the starter gates', () => {
  const walked = walkStarters(() => {
    return svelteTarget;
  }, 'svelte');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walked.twice).toEqual([]);
  });

  it('each open under some answer set and shut under another', () => {
    expect(walked.fixed).toEqual([]);
  });
});
