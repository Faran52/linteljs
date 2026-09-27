import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { allowBuildsBlock } from './emitUtils';

describe('allowBuildsBlock', () => {
  it('allows the four builds every target approves, sorted', () => {
    expect(allowBuildsBlock(answersFor({ target: 'svelte' }))).toBe(
      'allowBuilds:\n'
      + "  '@swc/core': true\n"
      + "  'fsevents': true\n"
      + "  'sharp': true\n"
      + "  'unrs-resolver': true\n",
    );
  });

  it('allows only the shared builds for the react target', () => {
    expect(allowBuildsBlock(answersFor({ target: 'react' }))).toBe(
      'allowBuilds:\n'
      + "  '@swc/core': true\n"
      + "  'fsevents': true\n"
      + "  'sharp': true\n"
      + "  'unrs-resolver': true\n",
    );
  });

  it("takes a hosted framework's build allowance into the host", () => {
    const onAstro = allowBuildsBlock(answersFor({
      target: 'astro',
      hostedFramework: 'vue',
    }));

    expect(onAstro).toContain("'vue-demi': true");

    const onExtension = allowBuildsBlock(answersFor({
      target: 'webextension',
      hostedFramework: 'vue',
    }));

    expect(onExtension).toContain("'vue-demi': true");
  });

  it('names no framework build where the host hosts none', () => {
    expect(allowBuildsBlock(answersFor({ target: 'astro' }))).not.toContain('vue-demi');
    expect(allowBuildsBlock(answersFor({ target: 'webextension' }))).not.toContain('vue-demi');
  });

  it('merges in the builds a target needs beyond the shared four, sorted with them', () => {
    const output = allowBuildsBlock(answersFor({ target: 'angular' }));

    expect(output).toBe(
      'allowBuilds:\n'
      + "  '@parcel/watcher': true\n"
      + "  '@swc/core': true\n"
      + "  'esbuild': true\n"
      + "  'fsevents': true\n"
      + "  'lmdb': true\n"
      + "  'msgpackr-extract': true\n"
      + "  'sharp': true\n"
      + "  'unrs-resolver': true\n",
    );
  });
});
