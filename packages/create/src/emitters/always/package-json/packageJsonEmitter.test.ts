import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { MANAGER_FLOORS, NODE_ENGINE } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import {
  ANSWERS,
  type Answers,
  DEFAULT_ANSWERS,
  type Form,
  type HostedFramework,
  type Library,
  type PackageManager,
  type Router,
  type TargetId,
  type Testing,
} from '@answers';

import { VERSIONS } from './constants';
import {
  buildDevDependencies,
  emitPackageJson,
  type PackageJson,
  parsePackageJson,
  patchPackageJson,
  versioned,
} from './packageJsonEmitter';

interface AnswerOverrides {
  target?: TargetId;
  hostedFramework?: HostedFramework;
  testing?: Testing;
  packageManager?: PackageManager;
  packageManagerVersion?: string;
  libraries?: Library[];
  form?: Form;
  store?: boolean;
  router?: Router;
}

interface Sibling {
  name: string;
  version: string;
}

const FORMS = valuesOf(ANSWERS.form.values);
const LIBRARIES = valuesOf(ANSWERS.libraries.values);
const TARGET_IDS = valuesOf(ANSWERS.target.values);

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

const SCAFFOLDED: PackageJson = {
  name: 'demo-app',
  version: '0.0.0',
  private: true,
  dependencies: { react: '^19.2.0' },
  devDependencies: {
    vite: '^7.2.0',
    prettier: '^3.6.0',
  },
  scripts: {
    dev: 'vite',
    build: 'vite build',
    lint: 'vite lint',
  },
};

// A silent skip on a missing VERSIONS entry is how @types/node vanished from every generated project.
describe('versioned', () => {
  it('has a resolvable range for every dependency every target and library declares', () => {
    for (const target of TARGET_IDS) {
      for (const library of LIBRARIES) {
        expect(() => {
          return patchPackageJson({}, answersFor({
            target,
            libraries: [library],
            store: true,
          }));
        }).not.toThrow();
      }

      for (const form of FORMS) {
        expect(() => {
          return patchPackageJson({}, answersFor({
            target,
            form,
            store: true,
          }));
        }).not.toThrow();
      }
    }
  });

  it('stops on a name it has no range for, rather than dropping it', () => {
    expect(() => {
      return versioned(['eslint', 'not-a-real-package']);
    }).toThrow('No version in VERSIONS for not-a-real-package');
  });

  it('drops the empty name, sorts and de-duplicates what is left', () => {
    expect(Object.keys(versioned(['vitest', '', 'eslint', 'vitest']))).toEqual(['eslint', 'vitest']);
  });

  it('installs no TanStack binding for the one target that has none', () => {
    const patched = patchPackageJson(
      {},
      answersFor({
        target: 'webextension',
        libraries: ['tanstack-query'],
      }),
    );

    expect(patched.dependencies).toBeUndefined();
    expect(patched.devDependencies).toHaveProperty('@tanstack/eslint-plugin-query');
  });
});

describe('patchPackageJson', () => {
  it('removes recorded linteljs metadata and preserves unrelated package properties', () => {
    const existing = {
      name: 'demo',
      description: 'kept',
      linteljs: { target: DEFAULT_ANSWERS.target },
    };
    const patched = patchPackageJson(existing, DEFAULT_ANSWERS);

    expect(patched).not.toHaveProperty('linteljs');
    expect(patched).toHaveProperty('description', 'kept');
  });

  it('never emits linteljs metadata', () => {
    expect(JSON.parse(emitPackageJson({ name: 'demo' }, DEFAULT_ANSWERS)))
      .not.toHaveProperty('linteljs');
  });

  it('keeps the scaffolder dependencies and its own scripts', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({}));

    expect(patched.dependencies?.['react']).toBe('^19.2.0');
    expect(patched.devDependencies?.['vite']).toBe('^8.2.2');
    expect(patched.scripts?.['dev']).toBe('vite');
    expect(patched.name).toBe('demo-app');
    expect(patched.private).toBe(true);
  });

  it('wins on the scripts linteljs owns', () => {
    expect(patchPackageJson(SCAFFOLDED, answersFor({})).scripts?.['lint']).toBe('eslint .');
  });

  it('drops prettier, which @stylistic supersedes', () => {
    expect(patchPackageJson(SCAFFOLDED, answersFor({})).devDependencies).not.toHaveProperty(
      'prettier',
    );
  });

  // React Native declares the same package for its vitest transform, so the filter runs on what the scaffolder
  // left, not the merged result.
  it('keeps the inherited plugin-react, and keeps the one a target asks for', () => {
    const scaffolded: PackageJson = {
      ...SCAFFOLDED,
      devDependencies: {
        ...SCAFFOLDED.devDependencies,
        '@vitejs/plugin-react': '^6.0.0',
      },
    };

    expect(patchPackageJson(scaffolded, answersFor({ target: 'react' })).devDependencies)
      .toHaveProperty('@vitejs/plugin-react');
    expect(patchPackageJson(scaffolded, answersFor({ target: 'react-native' })).devDependencies)
      .toHaveProperty('@vitejs/plugin-react');
  });

  // Three declarations of one fact: the exact version corepack and pnpm switch to, the floor that was tested, and
  // the field npm and pnpm refuse the install over.
  it('sets type, and declares the recorded manager version three ways', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({
      packageManager: 'pnpm',
      packageManagerVersion: '12.5.1',
    }));

    expect(patched.type).toBe('module');
    expect(patched.packageManager).toBe('pnpm@12.5.1');
    expect(patched.engines).toEqual({
      node: NODE_ENGINE,
      pnpm: `>=${MANAGER_FLOORS.pnpm}`,
    });
    expect(patched.devEngines).toEqual({
      packageManager: {
        name: 'pnpm',
        onFail: 'error',
      },
    });
  });

  // A `packageManager: bun@x` is a field corepack would act on and cannot, so bun is told through `engines` alone.
  it('writes no packageManager field for bun', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({
      packageManager: 'bun',
      packageManagerVersion: '1.3.4',
    }));

    expect(patched).not.toHaveProperty('packageManager');
    expect(patched.engines).toEqual({
      node: NODE_ENGINE,
      bun: `>=${MANAGER_FLOORS.bun}`,
    });
    expect(patched.devEngines?.['packageManager']).toEqual({
      name: 'bun',
      onFail: 'error',
    });
  });

  // A config written before the version was recorded, which is every project generated before this.
  it('falls back to the floor where the config carries no version', () => {
    const patched = patchPackageJson(SCAFFOLDED, answersFor({ packageManager: 'npm' }));

    expect(patched.packageManager).toBe(`npm@${MANAGER_FLOORS.npm}`);
    expect(patched.engines?.['npm']).toBe(`>=${MANAGER_FLOORS.npm}`);
  });

  // What Node a project runs on is the scaffolder's to declare and not linteljs's to overwrite.
  it('keeps a devEngines entry the scaffolder wrote', () => {
    const patched = patchPackageJson(
      {
        devEngines: {
          runtime: {
            name: 'node',
            onFail: 'warn',
          },
        },
      },
      answersFor({}),
    );

    expect(patched.devEngines?.['runtime']).toEqual({
      name: 'node',
      onFail: 'warn',
    });
    expect(patched.devEngines?.['packageManager']).toBeDefined();
  });

  // React Native's `eas build` needs an account; `expo export` is the local bundle (measurements in DESIGN.md).
  it('preserves the scaffolder build script, and gates on it', () => {
    const patched = patchPackageJson(
      { scripts: { build: 'tsc -b && vite build' } },
      answersFor({ target: 'react' }),
    );

    expect(patched.scripts?.['build']).toBe('tsc -b && vite build');
    expect(patched.scripts?.['check']).toContain('pnpm build');
  });

  it('omits the test scripts and vitest when testing is declined', () => {
    const patched = patchPackageJson({}, answersFor({ testing: 'none' }));

    expect(patched.scripts).not.toHaveProperty('test');
    expect(patched.devDependencies).not.toHaveProperty('vitest');
  });

  it('installs the store dependency only on a yes', () => {
    const withStore = patchPackageJson({}, answersFor({ store: true }));
    const without = patchPackageJson({}, answersFor({}));
    const angular = patchPackageJson({}, answersFor({
      target: 'angular',
      store: true,
    }));

    expect(withStore.dependencies).toHaveProperty('zustand');
    expect(without.dependencies).toBeUndefined();
    expect(angular.dependencies).toHaveProperty('@ngrx/signals');
  });

  // A version pinned here would fight create-vue's own --pinia install.
  it('installs nothing for a store the scaffolder itself installs', () => {
    expect(patchPackageJson({}, answersFor({
      target: 'vue',
      store: true,
    })).dependencies)
      .toBeUndefined();
  });

  it('installs the framework binding for tanstack query, plus its lint plugin', () => {
    const vue = patchPackageJson({}, answersFor({
      target: 'vue',
      libraries: ['tanstack-query'],
    }));

    expect(vue.dependencies).toHaveProperty('@tanstack/vue-query');
    expect(vue.devDependencies).toHaveProperty('@tanstack/eslint-plugin-query');
  });

  it('installs the class linter beside the tailwind toolchain', () => {
    const withTailwind = patchPackageJson({}, answersFor({ libraries: ['tailwind'] }));
    const without = patchPackageJson({}, answersFor({ libraries: [] }));

    expect(withTailwind.devDependencies).toHaveProperty('eslint-plugin-better-tailwindcss');
    expect(withTailwind.devDependencies).toHaveProperty('tailwindcss');
    expect(without.devDependencies).not.toHaveProperty('eslint-plugin-better-tailwindcss');
  });

  // Astro calls the plugin from `astro.config.mjs` while owning no vite config; shipping both adapters once left
  // PostCSS installed with nothing to load it.
  it('gives astro the vite adapter alone, and postcss to the targets with neither route', () => {
    const astro = patchPackageJson({}, answersFor({
      target: 'astro',
      libraries: ['tailwind'],
    }));

    expect(astro.devDependencies).toHaveProperty('@tailwindcss/vite');
    expect(astro.devDependencies).not.toHaveProperty('@tailwindcss/postcss');

    for (const target of ['next', 'angular', 'react-native'] as const) {
      const postcss = patchPackageJson({}, answersFor({
        target,
        libraries: ['tailwind'],
      }));

      expect(postcss.devDependencies).toHaveProperty('@tailwindcss/postcss');
      expect(postcss.devDependencies).not.toHaveProperty('@tailwindcss/vite');
    }
  });

  // The node adapter's runtime entry needs astro in dependencies; a second entry drifted.
  it('declares astro once for an astro project, hosted or not', () => {
    const plain = patchPackageJson({}, answersFor({ target: 'astro' }));
    const hosted = patchPackageJson({}, answersFor({
      target: 'astro',
      hostedFramework: 'react',
      libraries: ['tailwind', 'zod', 'tanstack-query'],
    }));

    for (const patched of [plain, hosted]) {
      expect(patched.dependencies).toHaveProperty('astro');
      expect(patched.devDependencies).not.toHaveProperty('astro');
    }
  });

  it('adds no runtime dependency for a library that has no binding on this target', () => {
    const plain = patchPackageJson(
      {},
      answersFor({
        target: 'webextension',
        libraries: ['tanstack-query'],
      }),
    );

    expect(plain.dependencies).toBeUndefined();
    expect(plain.devDependencies).toHaveProperty('@tanstack/eslint-plugin-query');
  });

  it('installs no html plugins where the html layer is not composed', () => {
    expect(patchPackageJson({}, answersFor({ target: 'angular' })).devDependencies)
      .not.toHaveProperty('@html-eslint/eslint-plugin');
    expect(patchPackageJson({}, answersFor({ target: 'next' })).devDependencies)
      .not.toHaveProperty('@html-eslint/eslint-plugin');
    expect(patchPackageJson({}, answersFor({ target: 'react' })).devDependencies)
      .toHaveProperty('@html-eslint/eslint-plugin');
  });

  it('always wires husky through prepare', () => {
    expect(patchPackageJson({}, answersFor({})).scripts?.['prepare']).toBe('husky');
  });

  // Replacing SvelteKit's own prepare breaks typecheck.
  it('wires husky and the target step through postinstall on yarn, which runs no prepare', () => {
    const { scripts } = patchPackageJson({}, answersFor({
      target: 'svelte',
      packageManager: 'yarn',
    }));

    expect(scripts?.['postinstall']).toBe('svelte-kit sync && husky');
    expect(scripts).not.toHaveProperty('prepare');
  });

  it("keeps a target's own prepare ahead of husky rather than replacing it", () => {
    expect(patchPackageJson({}, answersFor({ target: 'svelte' })).scripts?.['prepare'])
      .toBe('svelte-kit sync && husky');
  });

  // Without it, lint:css cannot load the syntax the emitted config names.
  it('installs the SFC stylelint syntax only where a component holds the styles', () => {
    expect(patchPackageJson({}, answersFor({ target: 'vue' })).devDependencies)
      .toHaveProperty('postcss-html');
    expect(patchPackageJson({}, answersFor({ target: 'svelte' })).devDependencies)
      .toHaveProperty('postcss-html');
    expect(patchPackageJson({}, answersFor({ target: 'react' })).devDependencies)
      .not.toHaveProperty('postcss-html');
  });

  it('names the rendering library the vue testing rule tells an agent to use', () => {
    expect(patchPackageJson({}, answersFor({ target: 'vue' })).devDependencies)
      .toHaveProperty('@vue/test-utils');
    expect(patchPackageJson({}, answersFor({
      target: 'vue',
      testing: 'none',
    })).devDependencies)
      .not.toHaveProperty('@vue/test-utils');
  });
});

describe('parsePackageJson', () => {
  it('reads an object', () => {
    expect(parsePackageJson('{"name":"x"}').name).toBe('x');
  });

  it('rejects anything that is not one', () => {
    expect(() => {
      return parsePackageJson('[]');
    }).toThrow('does not contain a JSON object');
  });
});

// Naming vitest in a jest project is a check that fails on command-not-found.
describe('the test scripts', () => {
  it('installs no runner where tests were declined', () => {
    const devDependencies = buildDevDependencies(answersFor({ testing: 'none' }));

    expect(devDependencies).not.toHaveProperty('vitest');
    expect(devDependencies).not.toHaveProperty('jest');
  });

  // React Native loads through an adapter; it is still vitest underneath.
  it('gives react native the adapter on top of the shared runner', () => {
    const devDependencies = buildDevDependencies(answersFor({ target: 'react-native' }));

    expect(devDependencies).toHaveProperty('@srsholmes/vitest-react-native');
    expect(devDependencies).toHaveProperty('vitest');
    expect(devDependencies).toHaveProperty('@vitest/coverage-v8');
    expect(devDependencies).not.toHaveProperty('jest');
    expect(devDependencies).not.toHaveProperty('jest-expo');
  });
});

describe('the libraries added in 1.6.0', () => {
  it('binds the form library per framework, and the zod resolver only beside zod', () => {
    const vue = patchPackageJson({}, answersFor({
      target: 'vue',
      form: 'tanstack-form',
    }));
    const hookForm = patchPackageJson({}, answersFor({ form: 'react-hook-form' }));
    const withZod = patchPackageJson({}, answersFor({
      form: 'react-hook-form',
      libraries: ['zod'],
    }));

    expect(vue.dependencies).toHaveProperty('@tanstack/vue-form');
    expect(hookForm.dependencies).toHaveProperty('react-hook-form');
    expect(hookForm.dependencies).not.toHaveProperty('@hookform/resolvers');
    expect(withZod.dependencies).toHaveProperty('@hookform/resolvers');
  });

  it('gives Next its own t3-env package and every other target the core one', () => {
    expect(patchPackageJson({}, answersFor({ libraries: ['t3-env'] })).dependencies)
      .toHaveProperty('@t3-oss/env-core');
    expect(patchPackageJson({}, answersFor({
      target: 'next',
      libraries: ['t3-env'],
    })).dependencies).toHaveProperty('@t3-oss/env-nextjs');
  });

  it('installs the two runtime-only libraries as plain dependencies', () => {
    const { dependencies, devDependencies } = patchPackageJson({}, answersFor({
      libraries: ['es-toolkit', 'ts-pattern'],
    }));

    expect(dependencies).toHaveProperty('es-toolkit');
    expect(dependencies).toHaveProperty('ts-pattern');
    expect(devDependencies).not.toHaveProperty('es-toolkit');
  });

  it('binds tanstack query to the framework a host renders with', () => {
    const hosted = patchPackageJson({}, answersFor({
      target: 'astro',
      hostedFramework: 'react',
      libraries: ['tanstack-query'],
    }));

    expect(hosted.dependencies).toHaveProperty('@tanstack/react-query');
  });

  it('takes NativeWind on React Native, where Metro has no Tailwind pipeline', () => {
    const native = patchPackageJson({}, answersFor({
      target: 'react-native',
      libraries: ['tailwind'],
    }));

    expect(native.dependencies).toHaveProperty('nativewind');
    expect(native.dependencies).toHaveProperty('react-native-css');
    expect(native.devDependencies).toHaveProperty('postcss');
    expect(patchPackageJson({}, answersFor({ libraries: ['tailwind'] })).dependencies ?? {})
      .not.toHaveProperty('nativewind');
  });
});

describe('the router', () => {
  it('installs react-router alone', () => {
    const { dependencies, devDependencies } = patchPackageJson({}, answersFor({ router: 'react-router' }));

    expect(dependencies).toHaveProperty('react-router');
    expect(devDependencies).not.toHaveProperty('@tanstack/router-plugin');
  });

  it('installs tanstack router with its vite plugin and lint plugin', () => {
    const { dependencies, devDependencies } = patchPackageJson({}, answersFor({ router: 'tanstack-router' }));

    expect(dependencies).toHaveProperty('@tanstack/react-router');
    expect(devDependencies).toHaveProperty('@tanstack/router-plugin');
    expect(devDependencies).toHaveProperty('@tanstack/eslint-plugin-router');
  });

  it('installs no router by default', () => {
    expect(patchPackageJson({}, answersFor({})).dependencies ?? {}).not.toHaveProperty('react-router');
  });
});

// Measured on bun 1.3.11: a `bunfig.toml` `allowBuilds` key is ignored and the postinstall stays blocked; only
// `trustedDependencies` in package.json is read.
describe('trustedDependencies', () => {
  it('names every approved build for bun and nothing for the other managers', () => {
    const bun = patchPackageJson({}, answersFor({
      target: 'react-native',
      packageManager: 'bun',
    }));

    expect(bun.trustedDependencies).toEqual(expect.arrayContaining(['sharp', 'unrs-resolver', 'esbuild']));
    expect(patchPackageJson({}, answersFor({ packageManager: 'pnpm' }))).not.toHaveProperty('trustedDependencies');
  });
});

// npm 12 blocks unlisted install scripts and warns; `.npmrc` `allow-scripts` is ignored once package.json has it.
describe('allowScripts', () => {
  it('approves every build for npm, keeps what the scaffolder approved, and writes nothing elsewhere', () => {
    const npm = patchPackageJson({ allowScripts: { 'some-native': true } }, answersFor({
      target: 'angular',
      packageManager: 'npm',
    }));

    expect(npm.allowScripts).toMatchObject({
      'some-native': true,
      'esbuild': true,
      'lmdb': true,
      'fsevents': true,
      'unrs-resolver': true,
    });
    expect(patchPackageJson({}, answersFor({ packageManager: 'pnpm' }))).not.toHaveProperty('allowScripts');
  });

  /**
   * One list reaches all three managers now, so npm gets no more and no less than pnpm and bun. `fsevents` is
   * measured: `COLLECT_NPM=... collect:builds` against
   * npm 12, which blocks where npm 11 only warns, names `fsevents` on eleven of the seventeen combinations and
   * nothing else. `@swc/core` and `sharp` are reached by nothing and carried as insurance, an allowance for an
   * absent package being silent on both managers. Pinned exactly, so a fifth name has to be added on purpose.
   */
  it('gives npm the same list as every other manager', () => {
    const npm = patchPackageJson({}, answersFor({
      target: 'react',
      packageManager: 'npm',
    }));

    expect(Object.keys(npm.allowScripts ?? {}).sort((left, right) => {
      return left.localeCompare(right, 'en');
    })).toEqual(['@swc/core', 'fsevents', 'sharp', 'unrs-resolver']);
  });
});

// The only ranges this repository can check without the network. `^0.1.0` once sat while the package reached 0.2.0:
// a caret on 0.x is minor-locked.
const WORKSPACE_PACKAGES = ['eslint-config', 'eslint-plugin'];

const siblingIn = (directory: string): Sibling => {
  const path = join(import.meta.dirname, '..', '..', '..', '..', '..', directory, 'package.json');
  const { name, version } = parsePackageJson(readFileSync(path, 'utf8'));

  if (name === undefined || version === undefined) {
    throw new Error(`${path} declares no name or version`);
  }

  return {
    name,
    version,
  };
};

describe('VERSIONS against the workspace', () => {
  it.each(WORKSPACE_PACKAGES)('carries no stale range for %s', (directory) => {
    const { name, version } = siblingIn(directory);
    const range = VERSIONS[name];

    // Only @linteljs/eslint-config is written into a generated project.
    expect(range === undefined || range === `^${version}`).toBe(true);
  });

  it('names the one package a generated project depends on', () => {
    expect(VERSIONS[siblingIn('eslint-config').name]).toBeDefined();
  });
});

// An entry in both places must not ship something older than the layers were built against. A line match, not a
// YAML parser, for a flat block.
const catalogEntries = (): [string, string][] => {
  const workspaceRoot = join(import.meta.dirname, '..', '..', '..', '..', '..', '..');
  const yaml = readFileSync(join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf8');
  const lines = yaml.split('\n');
  const start = lines.indexOf('catalog:');

  if (start === -1) {
    throw new Error('pnpm-workspace.yaml declares no catalog');
  }

  const entries: [string, string][] = [];

  // Line by line: a regex spanning a block is the shape `sonarjs/slow-regex` reports.
  for (const line of lines.slice(start + 1)) {
    const indented = line.startsWith(' ') || line.startsWith('\t');

    if (!indented && line.trim() !== '') {
      break;
    }

    const trimmed = line.trim();
    const separator = trimmed.indexOf(':');

    if (trimmed.startsWith('#') || separator === -1) {
      continue;
    }

    const name = trimmed.slice(0, separator).replaceAll("'", '');

    entries.push([name, trimmed.slice(separator + 1).trim()]);
  }

  return entries;
};

// So `^10.8.1` and `~10.8.1` compare as numbers.
const floorOf = (range: string): number[] => {
  return range.replace(/^[\^~]/, '').replace(/-rc\.\d+/, '').split('.').map(Number);
};

const atLeast = (range: string, minimum: string): boolean => {
  const left = floorOf(range);
  const right = floorOf(minimum);

  return left.every((part, index) => {
    const other = right[index] ?? 0;

    return part === other || part > other || left.slice(0, index).some((earlier, at) => {
      return earlier > (right[at] ?? 0);
    });
  });
};

// A range older than what `@linteljs/eslint-config` declares hands a project a plugin its config never ran against;
// five had drifted before anything checked. `catalog:` entries answer in the block above.
const configDependencies = (): [string, string][] => {
  const path = join(import.meta.dirname, '..', '..', '..', '..', '..', 'eslint-config', 'package.json');
  const { devDependencies } = parsePackageJson(readFileSync(path, 'utf8'));

  return Object.entries(devDependencies ?? {}).filter(([, range]) => {
    return range !== 'catalog:';
  });
};

describe('VERSIONS against the config it installs beside', () => {
  it('reads dependencies off the config, so the assertion below is not vacuous', () => {
    expect(configDependencies().length).toBeGreaterThan(0);
  });

  it('ships nothing older than the version the layers were built against', () => {
    const stale = configDependencies()
      .filter(([name, range]) => {
        const shipped = VERSIONS[name];

        return shipped !== undefined && !atLeast(shipped, range);
      })
      .map(([name, range]) => {
        return `${name}: VERSIONS has ${String(VERSIONS[name])}, eslint-config has ${range}`;
      });

    expect(stale).toEqual([]);
  });
});

describe('VERSIONS against the workspace catalog', () => {
  it('reads a catalog with entries in it, so the assertion below is not vacuous', () => {
    expect(catalogEntries().length).toBeGreaterThan(0);
  });

  it('ships nothing older than the version this workspace installs', () => {
    const stale = catalogEntries()
      .filter(([name, range]) => {
        const shipped = VERSIONS[name];

        return shipped !== undefined && !atLeast(shipped, range);
      })
      .map(([name, range]) => {
        return `${name}: VERSIONS has ${String(VERSIONS[name])}, catalog has ${range}`;
      });

    expect(stale).toEqual([]);
  });
});

describe('MANAGER_FLOORS against the workspace', () => {
  /**
   * The direction the floor reads: a project is refused below this and pinned to its own executor's version above
   * it, so what matters is that the floor is one this repository has run. A floor above the pnpm this workspace
   * develops on would be a floor nothing here has ever gated at.
   */
  it('floors pnpm no higher than the one this workspace runs', () => {
    const path = join(import.meta.dirname, '..', '..', '..', '..', '..', '..', 'package.json');
    const { packageManager } = parsePackageJson(readFileSync(path, 'utf8'));
    const running = String(packageManager).replace('pnpm@', '');

    expect(atLeast(running, MANAGER_FLOORS.pnpm)).toBe(true);
  });
});
