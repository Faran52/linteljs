import { walkStarters } from '@mocks/starterWalk';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { nuxtTarget } from './nuxtTarget';

describe('nuxtTarget', () => {
  it('is the record the nuxt answer names', () => {
    expect(nuxtTarget.id).toBe('nuxt');
  });

  // Nuxt renders the document and owns Vite, so neither an `index.html` nor a vite config is this CLI's to write.
  it('writes no document and no vite config of its own', () => {
    expect(nuxtTarget.html).toBe(false);
    expect(nuxtTarget.vite).toBe(false);
  });
});

/*
 * Every `when` on the record, over every answer set it can see. `starterSourceEmitter` refuses two spellings of
 * one destination, and a gate that never opens, or never shuts, decides nothing.
 */
describe('the starter gates', () => {
  const walked = walkStarters(() => {
    return nuxtTarget;
  }, 'nuxt');

  it('write at most one spelling of each destination under any answer set', () => {
    expect(walked.twice).toEqual([]);
  });

  it('each open under some answer set and shut under another', () => {
    expect(walked.fixed).toEqual([]);
  });
});
