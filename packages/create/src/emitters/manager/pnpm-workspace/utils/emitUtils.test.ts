import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type Browser,
  DEFAULT_ANSWERS,
  type HostedFramework,
  type TargetId,
} from '@answers';

import {
  allowBuildsBlock,
  emitPnpmWorkspace,
  peerRulesBlock,
} from './emitUtils';

interface AnswerOverrides {
  target?: TargetId;
  browser?: Browser;
  hostedFramework?: HostedFramework;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

describe('emitPnpmWorkspace', () => {
  // One list for every manager now: the measured names and the two carried as insurance, sorted.
  it('allows the four builds every target approves, sorted', () => {
    expect(allowBuildsBlock(answersFor({ target: 'svelte' }))).toBe(
      'allowBuilds:\n'
      + "  '@swc/core': true\n"
      + "  'fsevents': true\n"
      + "  'sharp': true\n"
      + "  'unrs-resolver': true\n",
    );
  });

  // `@vitejs/plugin-react` has no native binary, so React needs no extra build allowance.
  it('allows only the shared builds for the react target', () => {
    expect(allowBuildsBlock(answersFor({ target: 'react' }))).toBe(
      'allowBuilds:\n'
      + "  '@swc/core': true\n"
      + "  'fsevents': true\n"
      + "  'sharp': true\n"
      + "  'unrs-resolver': true\n",
    );
  });

  /**
   * `@tanstack/vue-query` pulls `vue-demi`, whose postinstall pnpm refuses unless it is named. The Vue record said so
   * and the two hosts did not, so `create` died on ERR_PNPM_IGNORED_BUILDS for every Astro or extension project
   * hosting Vue.
   */
  it("takes a hosted framework's build allowance into the host", () => {
    expect(allowBuildsBlock(answersFor({
      target: 'astro',
      hostedFramework: 'vue',
    }))).toContain("'vue-demi': true");
    expect(allowBuildsBlock(answersFor({
      target: 'webextension',
      hostedFramework: 'vue',
    }))).toContain("'vue-demi': true");
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

/**
 * None left. All three allowances this table used to carry were for plugins nothing installs any more: the layers
 * take `import-x` and `jsx-a11y-x`, `eslint-plugin-solid` admits eslint 10, and `eslint-plugin-astro` 3.2 peers the
 * fork itself rather than only the plugin it replaced. Measured against the lockfiles rather than assumed: neither
 * `eslint-plugin-import` nor `eslint-plugin-jsx-a11y` appears in this workspace's or a generated project's.
 */
describe('peerDependencyRules', () => {
  it('writes no block at all for a target that caps nothing', () => {
    for (const target of ['react', 'next', 'solid', 'vue', 'astro', 'svelte'] as const) {
      const output = emitPnpmWorkspace(answersFor({ target }));

      expect(output).not.toContain('peerDependencyRules');
      expect(output).toContain('allowBuilds:');
    }
  });

  // Dead config a reader cannot tell from a live exemption is the thing worth refusing, so name the three by hand.
  it('names none of the plugins that used to need one', () => {
    for (const target of ['next', 'solid', 'astro'] as const) {
      const output = emitPnpmWorkspace(answersFor({ target }));

      expect(output).not.toContain('jsx-a11y');
      expect(output).not.toContain('eslint-plugin-solid>');
      expect(output).not.toContain('eslint-plugin-import>');
    }
  });
});

describe('peer allowances a target carries', () => {
  it('lets Angular install vitest 5 under a build that peers on 4', () => {
    expect(peerRulesBlock(answersFor({ target: 'angular' }))).toContain("    '@angular/build>vitest': '5'\n");
    expect(peerRulesBlock(answersFor({ target: 'react' }))).not.toContain('@angular/build');
  });
});

/**
 * React Native's own toolchain disagrees with itself about metro-config, which is a resolution this CLI can state.
 * A deprecation is not: nothing here mutes one, for any target. React Native's `expo` reaches an end-of-life `uuid`,
 * the notice is true, and it belongs to whoever owns the dependency.
 */
describe('react native allowances', () => {
  it('allows the metro-config peer react-native resolves past, and mutes no deprecation', () => {
    const output = emitPnpmWorkspace(answersFor({ target: 'react-native' }));

    expect(output).toContain("    '@react-native/community-cli-plugin>@react-native/metro-config': '0.87.1'");
    expect(output).not.toContain('allowedDeprecatedVersions');
  });

  it('mutes no deprecation for a firefox extension either', () => {
    expect(emitPnpmWorkspace(answersFor({
      target: 'webextension',
      browser: 'firefox',
    }))).not.toContain('allowedDeprecatedVersions');
  });
});
