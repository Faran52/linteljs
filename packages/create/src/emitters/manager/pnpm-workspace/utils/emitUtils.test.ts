import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { allowBuildsBlock, overridesBlock } from './emitUtils';

describe('overridesBlock', () => {
  it('quotes each name and version, one per line', () => {
    const block = overridesBlock({
      '@scope/a': '1.0.0',
      'b': '2.0.0',
    });

    expect(block).toBe("overrides:\n  '@scope/a': '1.0.0'\n  'b': '2.0.0'\n");
  });
});

describe('allowBuildsBlock', () => {
  it('allows the four builds every target approves, sorted', () => {
    const actual = allowBuildsBlock(answersFor({ target: 'svelte' }));

    expect(actual).toBe(
      'allowBuilds:\n'
      + "  '@swc/core': true\n"
      + "  'fsevents': true\n"
      + "  'sharp': true\n"
      + "  'unrs-resolver': true\n",
    );
  });

  it('allows only the shared builds for the react target', () => {
    const actual = allowBuildsBlock(answersFor({ target: 'react' }));

    expect(actual).toBe(
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
    const actual = allowBuildsBlock(answersFor({ target: 'astro' }));
    expect(actual).not.toContain('vue-demi');
    const actual2 = allowBuildsBlock(answersFor({ target: 'webextension' }));
    expect(actual2).not.toContain('vue-demi');
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
