import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import {
  ANSWERS,
  type Data,
  DEFAULT_ANSWERS,
  type Router,
  type Styling,
  type TargetId,
  type Testing,
} from '@answers';

import { setupTestsPath } from '../../always/banned-patterns/bannedPatternsEmitter';

import { emitVitestConfig, vitestConfigEmitter } from './vitestConfigEmitter';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
  router?: Router;
  styling?: Styling;
  data?: Data;
}

const configFor = (overrides: AnswerOverrides = {}): string | null => {
  const answers = {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };

  return emitVitestConfig(answers, setupTestsPath(answers));
};

describe('emitVitestConfig', () => {
  /*
   * Next compiles StyleX through Babel and PostCSS, which a vitest run never goes through, so the plugin is named
   * in this config too. Without it every suite fails on an uncompiled `defineVars`.
   */
  it('names the stylex plugin where there is no vite config to inherit one from', () => {
    const config = configFor({
      target: 'next',
      styling: 'stylex',
    });

    expect(config).toContain("import { unpluginFactory as stylex } from '@stylexjs/unplugin';");
    expect(config).toContain('plugins: [createUnplugin(stylex).vite({ useCSSLayers: true })]');
  });
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

/*
 * A `*.stylex.ts` file is a token table the bundler compiles to CSS, so nothing imports it and nothing executes it.
 * Left in, it sits at zero against a 100% threshold and every StyleX project fails the gate it was born with.
 */
describe('the styling system', () => {
  it('keeps a StyleX token table out of coverage', () => {
    expect(configFor({ styling: 'stylex' })).toContain("'**/*.stylex.{ts,tsx}'");
  });
});

describe('the router', () => {
  it('keeps the route table out of coverage', () => {
    const config = configFor({ router: 'tanstack-router' }) ?? '';

    expect(config).toContain("'src/routes/**'");
    expect(configFor({})).not.toContain('src/routes/**');
  });
});

// The build configs are the project's after the first write: both reference repos rewrote their vite config wholesale.
describe('vitestConfigEmitter', () => {
  it('hands the config to the project after the first write', () => {
    expect(vitestConfigEmitter(DEFAULT_ANSWERS, EMPTY_PROJECT).map(({ target, preserve }) => {
      return [target, preserve];
    })).toEqual([['vitest.config.ts', true]]);
  });
});

// The 100% thresholds are measured over exactly the code somebody wrote.
describe('the coverage surface', () => {
  it('never counts the bootstrap entry, whose only assertion is about the framework', () => {
    expect(configFor()).toContain("'src/{main,index}.{ts,tsx}'");
  });

  // `src/**` alone hands rolldown files it cannot parse, printing `RolldownError: Parse failed` on a clean check.
  it.each<[TargetId, string]>([
    ['react', ''],
    ['svelte', ',svelte'],
    ['vue', ',vue'],
  ])('measures only what v8 can instrument on %s, plus its component format', (target, format) => {
    expect(configFor({ target })).toContain(`include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs${format}}']`);
  });

  it('adds the shells and declarations each target cannot execute', () => {
    expect(configFor({ target: 'next' })).toContain("'src/app/layout.tsx'");
    expect(configFor({ target: 'angular' })).toContain("'src/app/app.routes.ts'");
    expect(configFor({ target: 'react' })).not.toContain('layout');
  });

  /*
   * `<svelte:head>` compiles to a hydration branch, which a suite that renders rather than hydrates cannot reach,
   * so the root layout sits at 50% branches against a 100% threshold. It keeps its suite; only the measurement
   * goes, the same trade Next's root layout already takes.
   */
  it('excludes the svelte root layout, whose head is a branch no suite reaches', () => {
    expect(configFor({ target: 'svelte' })).toContain("'src/routes/+layout.svelte'");
  });

  it.each(valuesOf(ANSWERS.target.values))('keeps the thresholds at 100 on %s', (target) => {
    expect(configFor({ target }))
      .toMatch(/thresholds: \{\s*lines: 100,\s*branches: 100,\s*functions: 100,\s*statements: 100,\s*\}/u);
  });
});
