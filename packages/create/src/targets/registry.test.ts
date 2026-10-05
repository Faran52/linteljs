import { access, constants } from 'node:fs/promises';
import { join } from 'node:path';

import { composeConfig } from '@linteljs/eslint-config/compose-config';
import { byName } from '@mocks/byName';
import { ESLint } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  type Browser,
  type Framework,
  type HostedFramework,
  type Surface,
  type TargetId,
} from '@config/types';

import { keysOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';
import { TEMPLATES_ROOT } from '@disk';
import { buildDevDependencies } from '@emitters';

import { targetFor, TARGETS } from './registry';

import type { TargetRecord } from './types';

interface Axes {
  browsers: (Browser | undefined)[];
  hosted: (HostedFramework | undefined)[];
  surfaces: (Surface | undefined)[];
}

const BROWSERS = keysOf(ANSWERS.browser.values);
const HOSTED_FRAMEWORKS = keysOf(ANSWERS.hostedFramework.values);
const SURFACES = keysOf(ANSWERS.surfaces.values);
const TARGET_IDS = keysOf(ANSWERS.target.values);

// Pinned so the axis table is built without a record at collection; the first suite holds it to the records.
const HOSTS: Partial<Record<TargetId, Pick<TargetRecord, 'hostsBrowser' | 'hostsFramework'>>> = {
  astro: { hostsFramework: true },
  webextension: {
    hostsBrowser: true,
    hostsFramework: true,
  },
};

const recordFor = (target: TargetId): TargetRecord => {
  return targetFor({
    ...DEFAULT_ANSWERS,
    target,
  });
};

const assetPathsOf = (target: TargetRecord): string[] => {
  const ruleAssets = target.stateRules
    .map((rule) => {
      return `fragments/claude-rules/${rule}`;
    });
  const paths = [
    ...ruleAssets,
    `fragments/claude-rules/repo-structure.${target.id}.md`,
    `fragments/claude-rules/testing.${target.id}.md`,
  ];

  if (target.testSetup !== undefined) {
    paths.unshift(target.testSetup);
  }

  return paths;
};

const caseFor = (
  base: Answers,
  browser: Browser | undefined,
  hostedFramework: HostedFramework | undefined,
  surface: Surface | undefined,
): [string, Answers] => {
  const answers: Answers = { ...base };

  if (browser !== undefined) {
    answers.browser = browser;
  }

  if (hostedFramework !== undefined) {
    answers.hostedFramework = hostedFramework;
  }

  if (surface !== undefined) {
    answers.surfaces = [surface];
  }

  const parts = [
    base.target,
    browser,
    hostedFramework,
    surface,
  ];
  const label = parts
    .filter(Boolean)
    .join(' on ');
  const axisCase: [string, Answers] = [label, answers];

  return axisCase;
};

const axesOf = (base: Answers): Axes => {
  const { hostsBrowser, hostsFramework } = HOSTS[base.target] ?? {};

  const axes: Axes = {
    browsers: [undefined],
    hosted: [undefined],
    surfaces: [undefined],
  };

  if (hostsBrowser === true) {
    axes.browsers = [...BROWSERS];
    axes.surfaces = [undefined, ...SURFACES];
  }

  if (hostsFramework === true) {
    axes.hosted = [undefined, ...HOSTED_FRAMEWORKS];
  }

  return axes;
};

const axisCases = (targets: readonly TargetId[] = TARGET_IDS): [string, Answers][] => {
  const cases: [string, Answers][] = [];

  for (const target of targets) {
    const base: Answers = {
      ...DEFAULT_ANSWERS,
      target,
    };
    const {
      browsers,
      hosted,
      surfaces,
    } = axesOf(base);

    for (const browser of browsers) {
      for (const hostedFramework of hosted) {
        for (const surface of surfaces) {
          cases.push(caseFor(base, browser, hostedFramework, surface));
        }
      }
    }
  }

  return cases;
};

const AXIS_CASES = axisCases();

describe('TARGETS', () => {
  it('holds one record per known target id, keyed by its own id', () => {
    for (const id of TARGET_IDS) {
      expect(recordFor(id).id).toBe(id);
    }
  });

  it('hosts a browser or a framework exactly where the axis table expects', () => {
    const hosting = TARGET_IDS
      .map((id) => {
        const { hostsBrowser, hostsFramework } = recordFor(id);
        const row = {
          id,
          hostsBrowser,
          hostsFramework,
        };

        return row;
      });
    const expected = TARGET_IDS
      .map((id) => {
        const row = {
          id,
          ...HOSTS[id],
        };

        return row;
      });
    expect(hosting).toEqual(expected);
  });

  it('holds exactly the nine known targets, no more and no fewer', () => {
    const registered = Object.keys(TARGETS)
      .sort(byName);

    const expected = TARGET_IDS.toSorted(byName);
    expect(registered).toEqual(expected);
  });

  it.each(AXIS_CASES)('names only shipped assets on %s', async (_label, answers) => {
    const paths = assetPathsOf(targetFor(answers));

    const missingChecks = paths
      .map(async (path) => {
        try {
          await access(join(TEMPLATES_ROOT, path), constants.R_OK);

          return '';
        }
        catch {
          return path;
        }
      });

    const missing = await Promise.all(missingChecks);

    const filtered = missing.filter(Boolean);
    expect(filtered).toEqual([]);
  });

  it.each(AXIS_CASES)('has every suite on %s cover a file the target writes', (_label, answers) => {
    const { starterFiles, starterTests } = targetFor(answers);
    const starterTargets = starterFiles
      .map(({ target }) => {
        return target;
      });

    const written = new Set(starterTargets);

    const uncovering = starterTests
      .filter(({ covers }) => {
        return !written.has(covers);
      });

    expect(uncovering).toEqual([]);
  });
});

describe('what each target offers', () => {
  it.each<[TargetId, string[] | undefined, string[] | undefined]>([
    [
      'react',
      [
        'zustand',
        'redux-toolkit',
        'tanstack-store',
      ],
      [
        'react-router',
        'react-router-framework',
        'tanstack-router',
      ],
    ],
    [
      'next',
      [
        'zustand',
        'redux-toolkit',
        'tanstack-store',
      ],
      undefined,
    ],
    [
      'vue',
      ['pinia', 'tanstack-store'],
      undefined,
    ],
    [
      'nuxt',
      ['pinia', 'tanstack-store'],
      undefined,
    ],
    [
      'svelte',
      ['tanstack-store'],
      undefined,
    ],
    [
      'solid',
      ['tanstack-store'],
      undefined,
    ],
    [
      'angular',
      ['ngrx-signals'],
      undefined,
    ],
    [
      'astro',
      ['nanostores'],
      undefined,
    ],
    [
      'webextension',
      undefined,
      undefined,
    ],
    [
      'react-native',
      [
        'zustand',
        'redux-toolkit',
        'tanstack-store',
      ],
      undefined,
    ],
  ])('offers %s its own stores and routers', (target, stores, routers) => {
    const record = recordFor(target);

    const actual = [record.stores, record.routers];
    const expected = [stores, routers];
    expect(actual).toEqual(expected);
  });

  it.each<[string, Answers, string[], string[] | undefined]>([
    [
      'react',
      {
        ...DEFAULT_ANSWERS,
        target: 'react',
      },
      ['react-state.md', 'hooks-order.md'],
      undefined,
    ],
    [
      'next',
      {
        ...DEFAULT_ANSWERS,
        target: 'next',
      },
      ['react-state.md', 'hooks-order.md'],
      undefined,
    ],
    [
      'vue',
      {
        ...DEFAULT_ANSWERS,
        target: 'vue',
      },
      ['vue-reactivity.md'],
      undefined,
    ],
    [
      'nuxt',
      {
        ...DEFAULT_ANSWERS,
        target: 'nuxt',
      },
      ['vue-reactivity.md'],
      undefined,
    ],
    [
      'svelte',
      {
        ...DEFAULT_ANSWERS,
        target: 'svelte',
      },
      ['svelte-reactivity.md'],
      ['browser'],
    ],
    [
      'solid',
      {
        ...DEFAULT_ANSWERS,
        target: 'solid',
      },
      ['solid-reactivity.md'],
      ['development', 'browser'],
    ],
    [
      'angular',
      {
        ...DEFAULT_ANSWERS,
        target: 'angular',
      },
      [],
      undefined,
    ],
    [
      'astro',
      {
        ...DEFAULT_ANSWERS,
        target: 'astro',
      },
      [],
      undefined,
    ],
    [
      'react-native',
      {
        ...DEFAULT_ANSWERS,
        target: 'react-native',
      },
      ['react-state.md', 'hooks-order.md'],
      undefined,
    ],
    ...HOSTED_FRAMEWORKS
      .flatMap((hostedFramework): [string, Answers, string[], string[] | undefined][] => {
        const rulesByFramework = {
          react: ['react-state.md', 'hooks-order.md'],
          vue: ['vue-reactivity.md'],
          svelte: ['svelte-reactivity.md'],
          solid: ['solid-reactivity.md'],
        };
        const conditionsByFramework = {
          react: undefined,
          vue: undefined,
          svelte: ['browser'],
          solid: ['development', 'browser'],
        };
        const rules = rulesByFramework[hostedFramework];
        const conditions = conditionsByFramework[hostedFramework];
        const hosts = ['astro', 'webextension'] as const;

        return hosts
          .map((target) => {
            const row: [string, Answers, string[], string[] | undefined] = [
              `${target} hosting ${hostedFramework}`,
              {
                ...DEFAULT_ANSWERS,
                target,
                hostedFramework,
              },
              rules,
              conditions,
            ];

            return row;
          });
      }),
  ])('holds %s to its own state rules and test conditions', (_label, answers, rules, conditions) => {
    const record = targetFor(answers);

    const actual = [record.stateRules, record.testConditions];
    const expected = [rules, conditions];
    expect(actual).toEqual(expected);
  });
});

describe('targetFor', () => {
  it('returns the record matching the id it is asked for', () => {
    expect(recordFor('svelte').id).toBe('svelte');
  });

  it('returns a different record for a different id', () => {
    const record = recordFor('react');
    expect(record).not.toBe(recordFor('vue'));
  });
});

describe('robots.txt', () => {
  it('ships wherever a target serves a public directory', () => {
    const served = TARGET_IDS
      .filter((id) => {
        return recordFor(id).publicDirectory !== undefined;
      });
    const missing = served
      .filter((id) => {
        const { publicDirectory, starterFiles } = recordFor(id);

        return !starterFiles
          .some((file) => {
            return file.target === `${String(publicDirectory)}/robots.txt`;
          });
      });

    expect(served).toContain('react');
    expect(missing).toStrictEqual([]);
  });
});

const REACT_PLUGINS = [
  '@eslint-react/eslint-plugin',
  'eslint-plugin-react-hooks',
  'eslint-plugin-jsx-a11y-x',
];

const LAYER_PLUGINS: Record<Framework, string[]> = {
  'react': REACT_PLUGINS,
  'next': [...REACT_PLUGINS, '@next/eslint-plugin-next'],
  'react-native': REACT_PLUGINS
    .filter((name) => {
      return name !== 'eslint-plugin-jsx-a11y-x';
    }),
  'solid': ['eslint-plugin-solid', 'eslint-plugin-jsx-a11y-x'],
  'vue': ['eslint-plugin-vue', 'eslint-plugin-vuejs-accessibility'],
  'nuxt': ['eslint-plugin-vue', 'eslint-plugin-vuejs-accessibility'],
  'svelte': ['eslint-plugin-svelte'],
  'angular': ['angular-eslint'],
};

describe('a framework layer and the plugins it loads', () => {
  it.each(AXIS_CASES)('installs what the layers for %s import', (label, answers) => {
    const { framework } = targetFor(answers);
    const installed = Object.keys(buildDevDependencies(answers));

    const missing = (framework === undefined ? [] : LAYER_PLUGINS[framework])
      .filter((name) => {
        return !installed.includes(name);
      });

    const actual = {
      label,
      missing,
    };
    const expected = {
      label,
      missing: [],
    };
    expect(actual).toEqual(expected);
  });
});

describe('the emitted naming map on a utils file', () => {
  const namingCasesOf = (target: TargetId): [string, Answers][] => {
    return axisCases([target])
      .filter(([, answers], index, cases) => {
        const naming = JSON.stringify(targetFor(answers).naming);

        return cases
          .findIndex(([, other]) => {
            return JSON.stringify(targetFor(other).naming) === naming;
          }) === index;
      });
  };

  const findingsOn = async (answers: Answers, path: string): Promise<string[]> => {
    const { naming, folderNaming } = targetFor(answers);
    const config = await composeConfig({
      naming,
      folderNaming,
    });
    const eslint = new ESLint({
      cwd: '/project',
      overrideConfigFile: true,
      overrideConfig: config,
    });
    const [result] = await eslint.lintText('export const value = 1;\n', { filePath: `/project/${path}` });

    return (result?.messages ?? [])
      .map(({ ruleId }) => {
        return ruleId;
      })
      .filter((ruleId): ruleId is string => {
        return ruleId === 'check-file/filename-naming-convention';
      });
  };

  const utilsFindingsOn = async (answers: Answers): Promise<string[][]> => {
    const suffixed = answers.target === 'angular' ? 'fetch-extended-utils' : 'fetchExtendedUtils';
    const bare = answers.target === 'angular' ? 'fetch-extended' : 'fetchExtended';
    const suffixedFindings = await findingsOn(answers, `src/lib/utils/${suffixed}.ts`);
    const suiteFindings = await findingsOn(answers, `src/lib/utils/${suffixed}.test.ts`);
    const scriptFindings = await findingsOn(answers, 'scripts/utils/loggerUtils.ts');
    const bareFindings = await findingsOn(answers, `src/lib/utils/${bare}.ts`);
    const findings = [
      suffixedFindings,
      suiteFindings,
      scriptFindings,
      bareFindings,
    ];

    return findings;
  };

  it.each(TARGET_IDS)('holds each naming map %s emits to the Utils suffix, in its own case', async (target) => {
    const actual: Record<string, string[][]> = {};
    const expected: Record<string, string[][]> = {};

    for (const [label, answers] of namingCasesOf(target)) {
      actual[label] = await utilsFindingsOn(answers);

      expected[label] = [
        [],
        [],
        [],
        ['check-file/filename-naming-convention'],
      ];
    }

    expect(actual).toEqual(expected);
  });
});
