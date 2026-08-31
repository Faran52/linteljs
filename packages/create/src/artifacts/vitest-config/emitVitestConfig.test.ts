import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '../../model/answers/answers';
import { setupTestsPath } from '../banned-patterns/checkerArtifact';

import { emitVitestConfig } from './emitVitestConfig';

import type { TargetId, Testing } from '../../model/answers/answers';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
}

const configFor = (overrides: AnswerOverrides = {}): string | null => {
  const answers = {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };

  return emitVitestConfig(answers, setupTestsPath(answers));
};

describe('emitVitestConfig', () => {
  it('writes nothing when testing is declined', () => {
    expect(configFor({ testing: 'none' })).toBeNull();
  });

  it('merges the vite config where the target builds with vite', () => {
    const output = configFor({ target: 'react' });

    expect(output).toContain("import viteConfig from './vite.config.js';");
    expect(output).toContain('mergeConfig(');
  });

  it('carries the compiler plugin where the target has no vite config to merge', () => {
    const output = configFor({ target: 'angular' });

    expect(output).not.toContain('mergeConfig(');
    expect(output).toContain("import angular from '@analogjs/vite-plugin-angular';");
    expect(output).toContain("plugins: [angular({ tsconfig: './tsconfig.json' })],");
  });

  it('names the setup file the artifact list writes', () => {
    expect(configFor()).toContain("setupFiles: ['./__mocks__/setupTests.tsx']");
    expect(configFor({ target: 'react-native' })).toContain("setupFiles: ['./__mocks__/setupTests.tsx']");
  });

  it('covers the single-file component extension where the target has one', () => {
    expect(configFor({ target: 'vue' })).toContain(',vue}');
    expect(configFor({ target: 'react' })).not.toContain('vue');
  });

  /**
   * happy-dom no longer shims `localStorage` over Node 25+'s native one, which throws unconfigured;
   * disabling the native module hands the global back. React Native runs on `environment: 'node'`
   * and never touches it, so its platform projects stay as they were.
   */
  it('disables native web storage for every happy-dom target', () => {
    for (const target of ['react', 'next', 'vue', 'angular', 'svelte', 'solid', 'webextension'] as const) {
      expect(configFor({ target })).toContain("execArgv: ['--no-experimental-webstorage'],");
    }

    expect(configFor({ target: 'react-native' })).not.toContain('execArgv');
  });

  /**
   * Svelte and Solid ship a server build and a client build behind export conditions; without the condition vitest
   * resolves the server half and the first component rendered throws.
   * Written per target, not as one loop, so a target added without conditions has to be listed here on purpose.
   */
  it.each<[TargetId, string]>([
    ['svelte', "resolve: { conditions: ['browser'] },"],
    ['solid', "resolve: { conditions: ['development', 'browser'] },"],
  ])('gives %s the resolve conditions its runtime needs', (target, expected) => {
    expect(configFor({ target })).toContain(expected);
  });

  it.each<TargetId>(['react', 'next', 'vue', 'angular', 'webextension'])(
    'leaves %s on the default resolution',
    (target) => {
      expect(configFor({ target })).not.toContain('conditions');
    },
  );

  /**
   * A merged config inherits `tsconfigPaths` from `vite.config.ts`, but a standalone one has nothing to inherit it
   * from, and every alias in the emitted `tsconfig.json` is then unresolvable from a test.
   */
  it.each<TargetId>(['next', 'angular'])(
    'resolves the tsconfig aliases for %s, which has no vite config to merge',
    (target) => {
      expect(configFor({ target })).toContain('resolve: { tsconfigPaths: true },');
    },
  );
});
