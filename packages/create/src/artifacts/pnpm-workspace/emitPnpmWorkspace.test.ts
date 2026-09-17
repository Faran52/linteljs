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
} from '../../model/answers/answers';

import {
  allowBuildsBlock,
  emitPnpmWorkspace,
  peerRulesBlock,
} from './emitPnpmWorkspace';

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
  it('allows the two builds every target needs, sorted', () => {
    expect(allowBuildsBlock(answersFor({ target: 'svelte' }))).toBe(
      "allowBuilds:\n  'sharp': true\n  'unrs-resolver': true\n",
    );
  });

  // `@vitejs/plugin-react` has no native binary, so React needs no extra build allowance.
  it('allows only the shared builds for the react target', () => {
    expect(allowBuildsBlock(answersFor({ target: 'react' }))).toBe(
      "allowBuilds:\n  'sharp': true\n  'unrs-resolver': true\n",
    );
  });

  it('merges in the builds a target needs beyond the shared two, sorted with them', () => {
    const output = allowBuildsBlock(answersFor({ target: 'angular' }));

    expect(output).toBe(
      'allowBuilds:\n'
      + "  '@parcel/watcher': true\n"
      + "  'esbuild': true\n"
      + "  'lmdb': true\n"
      + "  'msgpackr-extract': true\n"
      + "  'sharp': true\n"
      + "  'unrs-resolver': true\n",
    );
  });
});

/**
 * One plugin left: `eslint-plugin-import` never runs, arriving as an optional peer of the resolver every project
 * installs. `jsx-a11y-x` and `solid` both admit eslint 10 now, so neither needs an allowance.
 */
describe('peerDependencyRules', () => {
  // The resolver is a dependency of the config every project installs, so this one is not target-specific.
  it('allows the inert resolver peer for every target', () => {
    const output = emitPnpmWorkspace(answersFor({ target: 'react' }));

    expect(output).toContain('peerDependencyRules:\n  allowedVersions:\n');
    expect(output).toContain("    'eslint-plugin-import>eslint': '10'");
  });

  // Both used to need one and no longer do: an allowance for a range that already admits the installed major is dead
  // config, and a reader cannot tell dead config from a live exemption.
  it('names no allowance for the accessibility or solid plugins', () => {
    for (const target of ['next', 'solid', 'vue'] as const) {
      const output = emitPnpmWorkspace(answersFor({ target }));

      expect(output).not.toContain('jsx-a11y');
      expect(output).not.toContain('eslint-plugin-solid>');
    }
  });

  // The one target that still meets the stale plugin: `eslint-plugin-astro` takes it as an optional peer and runs its
  // rules as `astro/jsx-a11y/*`, so the allowance is keyed by the plugin that brings it, not by the target.
  it('allows the stale peer the astro plugin drags in, sorted beside the resolver', () => {
    expect(emitPnpmWorkspace(answersFor({ target: 'astro' }))).toContain(
      'peerDependencyRules:\n  allowedVersions:\n'
      + "    'eslint-plugin-import>eslint': '10'\n"
      + "    'eslint-plugin-jsx-a11y>eslint': '10'\n",
    );
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
