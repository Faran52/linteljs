import { omit, pick } from 'es-toolkit';

import { surfacesOf } from '@utils/answerUtils';

import { emitLinteljsConfig } from '@emitters/always/linteljs-config/linteljsConfigEmitter';

import {
  CONFIG_SCHEMA_URL,
  CONFIG_SCHEMA_URL_V1,
  CURRENT_SCHEMA_VERSION,
  WORKSPACE_KEYS,
} from '../constants';
import { DEFAULT_ANSWERS } from '../registry';

import { parseLinteljsConfig } from './configUtils';
import { configOf, projectAnswersOf } from './projectUtils';

import type { Answers } from '@config/types';

interface ConfigOverrides {
  $schema?: string;
  target?: string | undefined;
  testing?: string;
  e2e?: string;
  stories?: string;
  packageManager?: string;
  browser?: string;
  hostedFramework?: string;
  surfaces?: string[];
  libraries?: string | (string | string[])[];
  styling?: string;
  data?: string;
  form?: string;
  router?: string;
  store?: boolean | string;
  typeSafety?: string;
  agents?: string | string[] | undefined;
  plugins?: string | (string | number)[];
  unexpected?: boolean | object;
  typescript?: boolean;
}

const v2 = (fields: object): object => {
  const body: object = {
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...configOf({ ...fields }, 'app'),
  };

  return body;
};

const answersOf = (text: string): Answers => {
  const parsed = parseLinteljsConfig(text);

  return projectAnswersOf(parsed, parsed.projects[0]);
};

const emit = (answers: Answers): string => {
  return emitLinteljsConfig(answers, 'app');
};

const config = (overrides: ConfigOverrides = {}): string => {
  const body = v2({
    ...DEFAULT_ANSWERS,
    ...overrides,
  });

  return JSON.stringify(body);
};

describe('parseLinteljsConfig', () => {
  it('reads the current envelope and every answer', () => {
    const actual = answersOf(emit(DEFAULT_ANSWERS));
    const expected = {
      ...DEFAULT_ANSWERS,
    };

    expect(actual)
      .toStrictEqual(expected);
  });

  it('defaults the extension axes when a config predates them', () => {
    const withoutAxes = JSON.stringify(v2({
      target: 'webextension',
      testing: 'vitest',
      packageManager: 'pnpm',
      libraries: [],
      typeSafety: 'strict',
      agents: ['claude-code'],
      plugins: [],
    }));

    const config = answersOf(withoutAxes);

    expect(config.browser).toBe('chrome');
    expect(config.layout).toBe('single');
    expect(config.hostedFramework).toBeUndefined();
    expect(config.surfaces).toBeUndefined();
    const configSurfaces = surfacesOf(config);
    const expected = ['popup', 'background'];
    expect(configSurfaces).toEqual(expected);
  });

  it('round-trips all three extension axes', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browser: 'firefox',
      hostedFramework: 'solid',
      surfaces: ['devtools-panel'],
      layout: 'monorepo',
    };

    const actual = answersOf(emit(answers));
    const expected = {
      ...answers,
    };

    expect(actual)
      .toEqual(expected);
  });

  it.each([
    ['browser', 'safari'],
    ['hostedFramework', 'angular'],
    ['layout', 'polyrepo'],
  ])('rejects an unknown %s', (field, value) => {
    const config = v2({
      ...DEFAULT_ANSWERS,
      [field]: value,
    });

    expect(() => {
      const configText = JSON.stringify(config);
      return answersOf(configText);
    }).toThrow(new RegExp(`${field} must be one of`));
  });

  it('round-trips the recorded manager and node versions', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      packageManagerVersion: '10.2.0',
      nodeVersion: '26.1.0',
    };

    const actual = answersOf(emit(answers));
    const expected = {
      ...answers,
    };
    expect(actual).toEqual(expected);
  });

  it('round-trips the resolver conditions', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      resolveConditions: ['import', 'default'],
    };

    const actual = answersOf(emit(answers));
    const expected = {
      ...answers,
    };
    expect(actual).toEqual(expected);
  });

  it.each([
    [[], 'must be a non-empty array'],
    [['import', 'import'], 'must not contain duplicate values'],
    ['import', 'must be a non-empty array'],
  ])('rejects resolveConditions of %j', (resolveConditions, message) => {
    expect(() => {
      const configText = JSON.stringify(v2({
        ...DEFAULT_ANSWERS,
        resolveConditions,
      }));
      return answersOf(configText);
    }).toThrow(new RegExp(message));
  });

  it('round-trips a project\'s own aliases, in both shapes', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      aliases: {
        '@engine': './src/lib/engine/index.ts',
        '@workers/*': './src/workers/*',
        '$lib': './src/lib',
      },
    };

    const actual = answersOf(emit(answers));
    const expected = {
      ...answers,
    };
    expect(actual).toEqual(expected);
  });

  it.each([
    [{ engine: './src/lib/engine' }, 'must start with @ or \\$'],
    ['@engine', 'aliases must be an object'],
  ])('rejects aliases of %j', (aliases, message) => {
    expect(() => {
      const configText = JSON.stringify(v2({
        ...DEFAULT_ANSWERS,
        aliases,
      }));
      return answersOf(configText);
    }).toThrow(new RegExp(message));
  });

  it('round-trips the stores a project packages for', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browsers: ['chrome', 'firefox'],
    };

    const actual = answersOf(emit(answers));
    const expected = {
      ...answers,
    };
    expect(actual).toEqual(expected);
  });

  it.each([
    [['chrome', 'chrome'], 'must not contain duplicate values'],
    [['safari'], 'must be one of'],
  ])('rejects browsers of %j', (browsers, message) => {
    expect(() => {
      const configText = JSON.stringify(v2({
        ...DEFAULT_ANSWERS,
        browsers,
      }));
      return answersOf(configText);
    }).toThrow(new RegExp(message));
  });

  it("round-trips a project's own ignores", () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      ignores: ['src/lib/compat-data/generatedRegistry.ts'],
    };

    const actual = answersOf(emit(answers));
    const expected = {
      ...answers,
    };
    expect(actual).toEqual(expected);
  });

  it.each([
    [[], 'must be a non-empty array'],
    [['a', 'a'], 'must not contain duplicate values'],
    ['a', 'must be a non-empty array'],
  ])('rejects ignores of %j', (ignores, message) => {
    expect(() => {
      const configText = JSON.stringify(v2({
        ...DEFAULT_ANSWERS,
        ignores,
      }));
      return answersOf(configText);
    }).toThrow(new RegExp(message));
  });

  it('rejects malformed JSON', () => {
    expect(() => {
      return answersOf('{');
    }).toThrow(/linteljs\.config\.json is not valid JSON/);
  });

  it('rejects a missing schema version', () => {
    expect(() => {
      return answersOf('{}');
    }).toThrow(/schemaVersion/);
  });

  it('rejects a schema version that is not a number', () => {
    expect(() => {
      const configText = JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: '1',
      });
      return answersOf(configText);
    }).toThrow(/schemaVersion must be 1 or 2/);
  });

  it('rejects a future schema version before the fields it carries', () => {
    expect(() => {
      const configText = JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: 3,
      });
      return answersOf(configText);
    }).toThrow(/schema version 3.*update @linteljs\/create/);
  });

  it('rejects a future schema version before inspecting new object-valued fields', () => {
    expect(() => {
      const configText = JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: 3,
        future: { nested: true },
      });
      return answersOf(configText);
    }).toThrow(/schema version 3.*update @linteljs\/create/);
  });

  it.each([
    [
      'a non-object value',
      '[]',
      /linteljs\.config\.json must be a JSON object/,
    ],
    [
      'an unexpected property',
      config({ unexpected: true }),
      /unexpected property: unexpected/,
    ],
    [
      'a project recorded as javascript',
      config({ typescript: false }),
      /unexpected property: typescript/,
    ],
    [
      'a different schema URL',
      config({ $schema: 'https://example.com/schema.json' }),
      /\$schema must be/,
    ],
    [
      'a missing target',
      config({ target: undefined }),
      /target must be one of: react, next, vue, nuxt, svelte, solid, angular, astro, webextension, react-native/,
    ],
    [
      'an unknown target',
      config({ target: 'ember' }),
      /target must be one of: react, next, vue, nuxt, svelte, solid, angular, astro, webextension, react-native/,
    ],
    [
      'a target named for an inherited property',
      config({ target: 'toString' }),
      /target must be one of: react, next, vue, nuxt, svelte, solid, angular, astro, webextension, react-native/,
    ],
    [
      'an unknown testing choice',
      config({ testing: 'mocha' }),
      /testing must be one of: vitest, jest, none/,
    ],
    [
      'a form library nested in a list',
      config({ libraries: [['react-hook-form']] }),
      /libraries must be one of/,
    ],
    [
      'an unknown package manager',
      config({ packageManager: 'deno' }),
      /packageManager must be one of: pnpm, npm, yarn, bun/,
    ],
    [
      'a non-array library list',
      config({ libraries: 'zod' }),
      /libraries must be an array/,
    ],
    [
      'an unknown library',
      config({ libraries: ['jquery'] }),
      /libraries must be one of: zod, es-toolkit, ts-pattern, t3-env/,
    ],
    [
      'a duplicate library',
      config({ libraries: ['zod', 'zod'] }),
      /libraries must not contain duplicate values/,
    ],
    [
      'a store outside the vocabulary',
      config({ store: 'false' }),
      /store must be one of: zustand, redux-toolkit/,
    ],
    [
      'a yes-or-no store at this version',
      config({ store: true }),
      /store must be one of: zustand, redux-toolkit/,
    ],
    [
      'an unknown type-safety choice',
      config({ typeSafety: 'unchecked' }),
      /typeSafety must be one of: strict, relaxed/,
    ],
    [
      'a non-array agent list',
      config({ agents: 'codex' }),
      /agents must be an array/,
    ],
    [
      'a missing agent list',
      config({ agents: undefined }),
      /agents must be an array/,
    ],
    [
      'an unknown agent',
      config({ agents: ['windsurf'] }),
      /agents must be one of: claude-code, codex, copilot, cursor/,
    ],
    [
      'a duplicate agent',
      config({ agents: ['codex', 'codex'] }),
      /agents must not contain duplicate values/,
    ],
    [
      'a non-array plugin list',
      config({ plugins: 'ponytail' }),
      /plugins must be an array/,
    ],
    [
      'a non-string plugin',
      config({ plugins: [1] }),
      /plugins must be one of: ponytail, context7, frontend-design/,
    ],
    [
      'an unknown plugin',
      config({ plugins: ['cursor'] }),
      /plugins must be one of: ponytail, context7, frontend-design/,
    ],
    [
      'a duplicate plugin',
      config({ plugins: ['ponytail', 'ponytail'] }),
      /plugins must not contain duplicate values/,
    ],
  ])('rejects %s', (_case, text, error) => {
    expect(() => {
      return answersOf(text);
    }).toThrow(error);
  });
});

describe('the router and the form libraries', () => {
  it('round-trips a router', () => {
    const answers = {
      ...DEFAULT_ANSWERS,
      router: 'tanstack-router' as const,
    };

    const actual = answersOf(emit(answers));
    const expected = { router: 'tanstack-router' };
    expect(actual).toMatchObject(expected);
    const routerless = answersOf(emit(DEFAULT_ANSWERS));
    expect(routerless).not.toHaveProperty('router');
  });

  it('rejects an unknown router', () => {
    expect(() => {
      const configText = config({ router: 'wouter' });
      return answersOf(configText);
    }).toThrow(/router must be one of: react-router, react-router-framework, tanstack-router/);
  });

  it('round-trips a form library, and keeps it out of libraries', () => {
    const answers = {
      ...DEFAULT_ANSWERS,
      form: 'tanstack-form' as const,
    };
    const parsed = answersOf(emit(answers));

    const expected = { form: 'tanstack-form' };
    expect(parsed).toMatchObject(expected);
    expect(parsed.libraries).not.toContain('tanstack-form');
    const actual = answersOf(emit(DEFAULT_ANSWERS));
    expect(actual).not.toHaveProperty('form');
  });

  it('round-trips a styling system, and keeps it out of libraries', () => {
    const parsed = answersOf(emit({
      ...DEFAULT_ANSWERS,
      styling: 'tailwind',
    }));

    const expected = { styling: 'tailwind' };
    expect(parsed).toMatchObject(expected);
    expect(parsed.libraries).not.toContain('tailwind');
    const actual = answersOf(emit(DEFAULT_ANSWERS));
    expect(actual).not.toHaveProperty('styling');
  });

  it('round-trips a data layer, and keeps it out of libraries', () => {
    const parsed = answersOf(emit({
      ...DEFAULT_ANSWERS,
      data: 'tanstack-query',
    }));

    const expected = { data: 'tanstack-query' };
    expect(parsed).toMatchObject(expected);
    expect(parsed.libraries).not.toContain('tanstack-query');
    const actual = answersOf(emit(DEFAULT_ANSWERS));
    expect(actual).not.toHaveProperty('data');
  });

  it('refuses rtk-query without the Redux store that ships it', () => {
    const parsed = answersOf(emit({
      ...DEFAULT_ANSWERS,
      store: 'redux-toolkit',
      data: 'rtk-query',
    }));

    const expected = { data: 'rtk-query' };
    expect(parsed).toMatchObject(expected);

    expect(() => {
      const configText = emit({
        ...DEFAULT_ANSWERS,
        store: 'zustand',
        data: 'rtk-query',
      });
      return answersOf(configText);
    }).toThrow(/rtk-query is not an answer for react/);
  });

  it('refuses stylex on a target with no spread site for it', () => {
    expect(() => {
      const configText = config({
        target: 'angular',
        styling: 'stylex',
      });
      return answersOf(configText);
    }).toThrow(/stylex is not an answer for angular/);
  });

  it.each([
    [{
      target: 'react',
      e2e: 'maestro',
    }, 'maestro is not an answer for react'],
    [{
      target: 'react-native',
      testing: 'jest',
      e2e: 'playwright',
    }, 'playwright is not an answer for react-native'],
    [{
      target: 'typescript',
      e2e: 'playwright',
    }, 'e2e is not an answer for typescript'],
    [{
      target: 'solid',
      stories: 'storybook',
    }, 'stories is not an answer for solid'],
    [{
      target: 'webextension',
      hostedFramework: 'react',
      stories: 'storybook',
    }, 'stories is not an answer for webextension'],
    [{
      target: 'astro',
      stories: 'storybook',
    }, 'stories is not an answer for astro'],
  ] as const)('refuses %o', (overrides, message) => {
    const configText = config(overrides);

    expect(() => {
      return answersOf(configText);
    }).toThrow(message);
  });

  it.each([
    {
      target: 'react-native',
      testing: 'jest',
      e2e: 'maestro',
    },
    {
      target: 'astro',
      hostedFramework: 'svelte',
      e2e: 'playwright',
      stories: 'storybook',
    },
  ] as const)('reads e2e and stories where the target takes them: %o', (overrides) => {
    const answers = answersOf(config(overrides));

    expect(answers).toMatchObject(overrides);
  });

  it.each([
    ['jest', 'jest'],
    ['none', 'none'],
  ])('reads testing %s on react-native as %s', (testing, expected) => {
    const configText = config({
      target: 'react-native',
      testing,
    });
    const parsed = answersOf(configText);
    expect(parsed.testing).toBe(expected);
  });

  it('refuses vitest on react-native', () => {
    expect(() => {
      const configText = config({
        target: 'react-native',
        testing: 'vitest',
      });
      return answersOf(configText);
    }).toThrow(/vitest is not an answer for react-native/);
  });

  it('refuses jest on a target that runs vitest', () => {
    expect(() => {
      const configText = config({ testing: 'jest' });
      return answersOf(configText);
    }).toThrow(/jest is not an answer for react/);
  });

  it('refuses a form library listed among the libraries', () => {
    expect(() => {
      const configText = config({ libraries: ['zod', 'react-hook-form'] });
      return answersOf(configText);
    }).toThrow(/react-hook-form is a form library: name it in "form" rather than in "libraries"/);
  });

  it('rejects an unknown form', () => {
    expect(() => {
      const configText = config({ form: 'formik' });
      return answersOf(configText);
    }).toThrow(/form must be one of: tanstack-form, react-hook-form/);
  });
});

describe('a version-one config', () => {
  const versionOne = (overrides: ConfigOverrides = {}): string => {
    return JSON.stringify({
      $schema: CONFIG_SCHEMA_URL_V1,
      ...DEFAULT_ANSWERS,
      ...overrides,
      schemaVersion: 1,
    });
  };

  it('lifts the vitest a 1.x react-native record wrote to jest', () => {
    const configText = versionOne({
      target: 'react-native',
      testing: 'vitest',
    });
    const { testing } = answersOf(configText);
    expect(testing).toBe('jest');
  });

  it.each([
    ['react', 'zustand'],
    ['angular', 'ngrx-signals'],
    ['vue', 'pinia'],
  ])('lands a yes on the first store %s offers', (target, store) => {
    const configText = versionOne({
      target,
      store: true,
    });
    const { store: landed } = answersOf(configText);

    expect(landed).toBe(store);
  });

  it('carries no store where the config said no', () => {
    const actual = answersOf(versionOne({ store: false }));
    expect(actual).not.toHaveProperty('store');
  });

  it('carries no store where the target no longer offers one', () => {
    const parsed = answersOf(versionOne({
      target: 'webextension',
      store: true,
    }));

    expect(parsed).not.toHaveProperty('store');
  });

  it('keeps a store a version-one file already names', () => {
    const configText = versionOne({ store: 'redux-toolkit' });
    const { store } = answersOf(configText);
    expect(store).toBe('redux-toolkit');
  });

  it.each([
    ['tanstack-form', 'vue'],
    ['react-hook-form', 'react'],
  ])('lifts %s out of libraries, and tailwind and tanstack-query with it', (form, target) => {
    const parsed = answersOf(versionOne({
      target,
      libraries: [
        form,
        'tailwind',
        'tanstack-query',
      ],
    }));

    expect(parsed.form).toBe(form);
    expect(parsed.styling).toBe('tailwind');
    expect(parsed.data).toBe('tanstack-query');
    expect(parsed.libraries).toEqual([]);
  });

  it('reports the current version and schema', () => {
    const config = parseLinteljsConfig(versionOne({ libraries: ['tanstack-form'] }));

    expect(config.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(config.$schema).toBe(CONFIG_SCHEMA_URL);
    const project = projectAnswersOf(config, config.projects[0]);
    const emitted: unknown = JSON.parse(emit(project));

    expect(emitted).toMatchObject({ schemaVersion: CURRENT_SCHEMA_VERSION });
  });

  it('leaves a config naming no form library alone', () => {
    const parsed = answersOf(versionOne());

    expect(parsed).not.toHaveProperty('form');
    expect(parsed.libraries).toEqual(DEFAULT_ANSWERS.libraries);
  });

  it('still rejects both form libraries at once', () => {
    expect(() => {
      const configText = versionOne({ libraries: ['tanstack-form', 'react-hook-form'] });
      return answersOf(configText);
    }).toThrow(/libraries must contain at most one of: tanstack-form, react-hook-form/);
  });

  it('holds a version-one file to the version-one schema url', () => {
    expect(() => {
      const configText = JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        ...DEFAULT_ANSWERS,
        schemaVersion: 1,
      });
      return answersOf(configText);
    }).toThrow(/\$schema must be .*v1\.schema\.json/);
  });
});

describe('answers a target never asks for', () => {
  it.each([
    [
      'a router on Vue',
      {
        target: 'vue',
        router: 'react-router',
      },
      'router is not an answer for vue',
    ],
    [
      'a hosted framework on React',
      {
        target: 'react',
        hostedFramework: 'vue',
      },
      'hostedFramework is not an answer for react',
    ],
    [
      'a browser on Svelte',
      {
        target: 'svelte',
        browser: 'firefox',
      },
      'browser is not an answer for svelte',
    ],
    [
      'surfaces on Next',
      {
        target: 'next',
        surfaces: ['popup'],
      },
      'surfaces is not an answer for next',
    ],
    [
      'zustand on Svelte',
      {
        target: 'svelte',
        store: 'zustand',
      },
      'zustand is not an answer for svelte',
    ],
    [
      'a store on the extension, which has none',
      {
        target: 'webextension',
        store: 'zustand',
      },
      'store is not an answer for webextension',
    ],
    [
      'react-hook-form on Vue',
      {
        target: 'vue',
        form: 'react-hook-form',
      },
      'react-hook-form is not an answer for vue',
    ],
  ])('refuses %s', (_case, overrides, message) => {
    expect(() => {
      const configText = config(overrides);
      return answersOf(configText);
    }).toThrow(message);
  });

  it.each(['next', 'react-native'])('accepts react-hook-form on %s', (target) => {
    const { form } = answersOf(config({
      target,
      testing: 'none',
      form: 'react-hook-form',
    }));

    expect(form).toBe('react-hook-form');
  });

  it.each([
    'vue',
    'svelte',
    'solid',
    'angular',
  ])('still refuses react-hook-form on %s', (target) => {
    expect(() => {
      const configText = config({
        target,
        form: 'react-hook-form',
      });
      return answersOf(configText);
    }).toThrow(`react-hook-form is not an answer for ${target}`);
  });

  it('accepts the same answers where the target asks for them', () => {
    const { form } = answersOf(config({
      target: 'astro',
      hostedFramework: 'react',
      form: 'react-hook-form',
    }));

    expect(form).toBe('react-hook-form');

    const { router } = answersOf(config({
      target: 'react',
      router: 'tanstack-router',
      store: 'redux-toolkit',
    }));

    expect(router).toBe('tanstack-router');
  });
});

describe('the mocking answer', () => {
  it('round-trips through a config rather than being dropped', () => {
    const body = v2({
      target: 'react',
      testing: 'vitest',
      packageManager: 'pnpm',
      libraries: [],
      typeSafety: 'strict',
      agents: [],
      plugins: [],
      mocking: 'msw',
    });
    const config = answersOf(JSON.stringify(body));

    expect(config.mocking).toBe('msw');
  });
});

describe('the languages answer', () => {
  const configWith = (target: string, extra: Record<string, string[]> = {}): string => {
    const body = v2({
      target,
      ...extra,
      testing: 'vitest',
      packageManager: 'pnpm',
      libraries: [],
      typeSafety: 'strict',
      agents: [],
      plugins: [],
      languages: ['ar', 'ja'],
    });

    return JSON.stringify(body);
  };

  it('round-trips through a config rather than being dropped', () => {
    const config = answersOf(configWith('react'));

    const expected = ['ar', 'ja'];
    expect(config.languages).toEqual(expected);
  });

  it('is taken by an extension with a popup and refused by one with no page to translate', () => {
    const popup = answersOf(configWith('webextension', { surfaces: ['popup'] }));

    const expected = ['ar', 'ja'];
    expect(popup.languages).toEqual(expected);

    expect(() => {
      const configText = configWith('webextension', { surfaces: ['background'] });
      return answersOf(configText);
    }).toThrow('languages is not an answer for webextension');
  });
});

describe('a version-three config', () => {
  const monorepo = (projects: object, top: object = {}): string => {
    return JSON.stringify({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...pick(DEFAULT_ANSWERS, WORKSPACE_KEYS),
      layout: 'monorepo',
      projects,
      ...top,
    });
  };

  const project = omit(DEFAULT_ANSWERS, WORKSPACE_KEYS);

  it('refuses a v2 config written flat, without projects', () => {
    const configText = JSON.stringify({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: 2,
      ...DEFAULT_ANSWERS,
    });

    expect(() => {
      return parseLinteljsConfig(configText);
    }).toThrow(/unexpected property: target/);
  });

  it('keeps each named project of a monorepo, in order', () => {
    const actual = parseLinteljsConfig(monorepo([
      {
        name: 'web',
        ...project,
      },
      {
        name: 'docs',
        ...project,
        target: 'astro',
      },
    ]));
    const names = actual.projects
      .map(({ name }) => {
        return name;
      });
    const second = actual.projects[1];

    expect(names).toEqual(['web', 'docs']);
    expect(second?.target).toBe('astro');
    expect(actual.layout).toBe('monorepo');
  });

  it.each([
    [
      'projects that are not an array',
      {},
      /projects must be an array/,
    ],
    [
      'no projects',
      [],
      /at least one project/,
    ],
    [
      'a project that is not an object',
      ['web'],
      /each of projects must be an object/,
    ],
    [
      'a workspace answer inside a project',
      [{
        name: 'web',
        ...project,
        agents: [],
      }],
      /agents is a workspace answer/,
    ],
    [
      'a name that is not a string',
      [{ name: 1, ...project }],
      /a project name must be a string/,
    ],
    [
      'an unnamed project',
      [project],
      /needs a name matching/,
    ],
    [
      'a name that is no directory',
      [{ name: 'Web App', ...project }],
      /needs a name matching/,
    ],
    [
      'a name that is not kebab-case',
      [{ name: 'my_app', ...project }],
      /needs a name matching/,
    ],
    [
      'two projects of one name',
      [{ name: 'web', ...project }, { name: 'web', ...project }],
      /project names must not/,
    ],
    [
      'a misfit answer in a later project',
      [{ name: 'web', ...project }, {
        name: 'x',
        ...project,
        target: 'mars',
      }],
      /target/,
    ],
  ])('refuses %s', (_label, projects, error) => {
    expect(() => {
      const configText = monorepo(projects);

      return parseLinteljsConfig(configText);
    }).toThrow(error);
  });

  it('refuses a second project in a single layout', () => {
    const configText = monorepo([project, project], { layout: 'single' });

    expect(() => {
      return parseLinteljsConfig(configText);
    }).toThrow(/a single layout holds one project/);
  });

  it('refuses an unexpected top-level property', () => {
    const configText = monorepo([{ name: 'web', ...project }], { target: 'react' });

    expect(() => {
      return parseLinteljsConfig(configText);
    }).toThrow(/unexpected property: target/);
  });
});
