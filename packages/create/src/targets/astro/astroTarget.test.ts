import {
  ANSWERED,
  byKey,
  componentStyleGates,
  type Condition,
  contactGates,
  type GateRow,
  mswGates,
  NOT_TANSTACK_QUERY,
  pickedBy,
  TAILWIND,
  TANSTACK_QUERY,
  walkGates,
  WITH_I18N,
  WITHOUT_I18N,
} from '@mocks/starterGates';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { LANGUAGES } from '@config/constants';

import { DEFAULT_ANSWERS } from '@answers';

import { astroTarget } from './astroTarget';
import { TRANSLATED } from './constants';

import type { Answers, HostedFramework } from '@config/types';

const answersFor = (overrides: Partial<Answers> = {}): Answers => {
  const answers: Answers = {
    ...DEFAULT_ANSWERS,
    target: 'astro',
    ...overrides,
  };

  return answers;
};

const recordFor = (overrides: Partial<Answers> = {}) => {
  const answers = answersFor(overrides);

  return astroTarget(answers);
};

describe('the astro record', () => {
  it('owns its document and its build', () => {
    expect(recordFor().html).toBe(false);
    expect(recordFor().vitePlugin).toBeUndefined();
    expect(recordFor().build).toBe('astro build');
  });

  it('runs its dev server and preview the way every other target does', () => {
    const scripts = recordFor().extraScripts;

    const expected = {
      dev: 'astro dev',
      preview: 'astro preview',
    };
    expect(scripts).toEqual(expected);
  });
});

describe('i18n', () => {
  it('translates through a client script of its own, with no library, compiler or test setup', () => {
    const expected = { dependencies: [] };
    expect(recordFor().i18n).toEqual(expected);
  });
});

describe('the build it owns', () => {
  it('owns no vite config and borrows the resolved one for tests', () => {
    const record = recordFor();

    expect(record.vitePlugin).toBeUndefined();
    expect(record.vitestFactory?.call).toBe('getViteConfig');

    const expected = [
      "import { getViteConfig } from 'astro/config';",
      '',
      "import 'vitest/config';",
    ];
    expect(record.vitestFactory?.imports).toEqual(expected);
  });

  it('swaps the solid integration plugin for one without hmr under a solid host', () => {
    const record = recordFor({ hostedFramework: 'solid' });

    const expected = {
      imports: [
        "import { getViteConfig } from 'astro/config';",
        "import solid from 'vite-plugin-solid';",
        "import { defineConfig } from 'vitest/config';",
      ],
      call: 'getViteConfig',
      swap: {
        name: 'solid',
        call: 'solid({ hot: false, ssr: true })',
      },
    };
    expect(record.vitestFactory).toEqual(expected);
  });

  it.each([
    'react',
    'vue',
    'svelte',
  ] as const)('swaps no plugin under a %s host', (hostedFramework) => {
    const record = recordFor({ hostedFramework });

    expect(record.vitestFactory?.swap).toBeUndefined();
  });

  it('gates on astro check, after a sync', () => {
    const record = recordFor();

    expect(record.typecheck).toBe('astro sync && astro check');
    expect(record.build).toBe('astro build');
    expect(record.prepare).toBe('astro sync');
  });

  it('extends the tsconfig astro publishes, and names the generated types', () => {
    const record = recordFor();

    expect(record.tsconfig.extends).toBe('astro/tsconfigs/strict');
    expect(record.tsconfig.include).toContain('.astro/types.d.ts');
    expect(record.tsconfig.include).toContain('**/*.astro');
  });

  it('asks for the astro layer and not the html one', () => {
    expect(recordFor().astro).toBe(true);
    expect(recordFor().html).toBe(false);
  });
});

describe('the hosted framework axis', () => {
  it('hosts nothing by default, and is still a complete target', () => {
    const record = recordFor();

    expect(record.hostsFramework).toBe(true);
    expect(record.framework).toBeUndefined();
    expect(record.stateRules).toEqual([]);
    const expected = ['astro'];
    expect(record.dependencies).toEqual(expected);
    expect(record.naming['src/**/*.astro']).toBe('!([a-z]*[A-Z]*)');
  });

  it.each<[HostedFramework, string, string]>([
    [
      'react',
      'src/**/*.tsx',
      '@astrojs/react',
    ],
    [
      'vue',
      'src/**/*.vue',
      '@astrojs/vue',
    ],
    [
      'svelte',
      'src/**/*.svelte',
      '@astrojs/svelte',
    ],
    [
      'solid',
      'src/**/*.tsx',
      '@astrojs/solid-js',
    ],
  ])('composes %s as an island', (hostedFramework, componentGlob, integration) => {
    const record = recordFor({ hostedFramework });

    expect(record.framework).toBe(hostedFramework);
    expect(record.devDependencies).toContain(integration);
    expect(record.naming['src/**/*.astro']).toBe('!([a-z]*[A-Z]*)');
    expect(record.naming[componentGlob]).toBe('!([a-z]*[A-Z]*)');
  });

  it('declares the react build plugin, so npm dedupes the copy `@astrojs/react` brings onto the held version', () => {
    const { devDependencies } = recordFor({ hostedFramework: 'react' });

    expect(devDependencies).toContain('@vitejs/plugin-react');
    expect(devDependencies).toContain('oxc-transform-react');
  });

  it('includes vue files in the tsconfig only for the vue host, so the project service finds its island', () => {
    const vueInclude = recordFor({ hostedFramework: 'vue' }).tsconfig.include;
    const reactInclude = recordFor({ hostedFramework: 'react' }).tsconfig.include;

    expect(vueInclude).toContain('**/*.vue');
    expect(reactInclude).not.toContain('**/*.vue');
  });

  it('includes svelte files in the tsconfig only for the svelte host', () => {
    const svelteInclude = recordFor({ hostedFramework: 'svelte' }).tsconfig.include;
    const vueInclude = recordFor({ hostedFramework: 'vue' }).tsconfig.include;

    expect(svelteInclude).toContain('**/*.svelte');
    expect(vueInclude).not.toContain('**/*.svelte');
  });

  it('brings the framework itself and its testing library beside astro', () => {
    const record = recordFor({ hostedFramework: 'vue' });

    const expected = ['astro', 'vue'];
    expect(record.dependencies).toEqual(expected);
    const testingLibrary = ['@vue/test-utils'];
    expect(record.testDevDependencies).toEqual(testingLibrary);
    const vueRules = ['vue-reactivity.md'];
    expect(record.stateRules).toEqual(vueRules);
  });

  it('declares astro once, as a runtime dependency, hosted or not', () => {
    const records = [recordFor(), recordFor({ hostedFramework: 'react' })];

    for (const record of records) {
      expect(record.dependencies).toContain('astro');
      expect(record.devDependencies).not.toContain('astro');

      const astroEntries = record.devDependencies
        .filter((name) => {
          return name === 'astro';
        });

      expect(astroEntries).toHaveLength(0);
    }
  });

  it('maps `#lib` only under a svelte host, whose island reads it', () => {
    const svelte = recordFor({ hostedFramework: 'svelte' }).packageImports;
    const react = recordFor({ hostedFramework: 'react' }).packageImports;

    expect(svelte).toEqual({ '#lib/*': './src/lib/*' });
    expect(react).toBeUndefined();
  });

  it('adds a jsx import source only where the framework needs one', () => {
    expect(recordFor({ hostedFramework: 'solid' }).tsconfig.jsxImportSource).toBe('solid-js');
    expect(recordFor({ hostedFramework: 'react' }).tsconfig.jsxImportSource).toBeUndefined();
    expect(recordFor().tsconfig.jsx).toBeUndefined();
  });

  it('installs its checker and the two packages the lint layer loads beside astro', () => {
    const record = recordFor();

    expect(record.dependencies).toContain('astro');
    expect(record.devDependencies).toContain('@astrojs/check');
    expect(record.devDependencies).toContain('eslint-plugin-astro');
    expect(record.devDependencies).toContain('astro-eslint-parser');
  });

  it('allows the build script astro cannot install without', () => {
    expect(recordFor().allowBuilds).toContain('esbuild');
  });

  it('adds no tailwind adapter of its own', () => {
    expect(recordFor({ styling: 'tailwind' }).devDependencies).not.toContain('@tailwindcss/vite');
    expect(recordFor({ styling: 'tailwind' }).devDependencies).not.toContain('@tailwindcss/postcss');
  });
});

const BILINGUAL_PATHS = [
  'src/config/statuses.ts',
  'src/config/standard.ts',
  ...TRANSLATED,
];

const I18N_ONLY_PATHS = [
  'src/i18n/i18n.ts',
  'src/i18n/i18n.test.ts',
  'src/i18n/locales.test.ts',
  'src/i18n/utils/languageUtils.ts',
  'src/i18n/utils/languageUtils.test.ts',
  'src/i18n/utils/cookieUtils.ts',
  'src/i18n/utils/cookieUtils.test.ts',
  'src/components/ui/code-text/CodeText.astro',
  ...LANGUAGES
    .map((language) => {
      return `src/i18n/locales/${language}/common.json`;
    }),
];

const NO_ISLAND: readonly Condition[] = [{ form: [undefined] }, { hostedFramework: [undefined] }];

const onIsland = (hosts: readonly HostedFramework[], rows: readonly GateRow[]): GateRow[] => {
  return rows
    .map(([key, conditions]): GateRow => {
      const row: GateRow = [key, conditions
        .map((condition) => {
          const gated: Condition = {
            form: ANSWERED,
            hostedFramework: hosts,
            ...condition,
          };

          return gated;
        })];

      return row;
    });
};

// Each host's own button and text input; a suite's spelling is shared, so its row names every host.
const islandGates = (button: string, extension: string): GateRow[] => {
  const paths = [button, 'text-input/TextInput'];
  const gates = paths
    .map((path): GateRow => {
      const row: GateRow = [`src/components/ui/${path}.${extension}`, [{}]];

      return row;
    });

  return gates;
};

const sheetGates = (button: string): GateRow[] => {
  const gates: GateRow[] = [
    [`../components/ui/${button}.css`, [{}]],
    ...componentStyleGates([button])
      .filter(([key]) => {
        return key.startsWith('src/components/ui/');
      }),
  ];

  return gates;
};

const BUTTON_SHEET_GATES = sheetGates('button/Button');

const SHARED_ISLAND_GATES: GateRow[] = onIsland([
  'react',
  'vue',
  'solid',
  'svelte',
], [
  ['src/pages/contact.astro', [{ languages: [undefined], mocking: [undefined] }]],
  ['src/pages/contact.astro@msw', [{ languages: [undefined], mocking: ['msw'] }]],
  ['src/pages/contact.astro@i18n', [{ languages: ANSWERED, mocking: [undefined] }]],
  ['src/pages/contact.astro@i18n-msw', [{ languages: ANSWERED, mocking: ['msw'] }]],
  ['src/views/contact/utils/contactCopyUtils.ts@i18n', [{ languages: ANSWERED }]],
  ['src/views/contact/utils/contactCopyUtils.test.ts@i18n', [{ languages: ANSWERED }]],
  ['../components/ui/text-input/TextInput.css', [{}]],
  ...componentStyleGates(['text-input/TextInput'])
    .filter(([key]) => {
      return key.startsWith('src/components/ui/');
    }),
  ...contactGates(['tanstack-query']),
  ['src/lib/services/contact-form/contactFormService.test.ts', [{}]],
  ['__mocks__/msw/handlers.ts@with-form', [{ mocking: ['msw'] }]],
  ['src/config/routes.ts@with-form', [{}]],
]);

const JSX_ISLAND_GATES: GateRow[] = onIsland(['react', 'solid'], [
  ['src/views/contact/ContactPage.tsx', [{ languages: [undefined], mocking: [undefined] }]],
  ['src/views/contact/ContactPage.tsx@msw', [{ languages: [undefined], mocking: ['msw'] }]],
  ['src/components/ui/index.ts', [{}]],
  ...islandGates('button/Button', 'tsx'),
  ['src/lib/providers/data/DataProvider.tsx', NOT_TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.tsx@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.test.tsx', [{}]],
  ['src/views/contact/ContactPage.test.tsx', [
    { hostedFramework: ['react'], languages: [undefined] },
    {
      hostedFramework: ['solid'],
      languages: [undefined],
      mocking: [undefined],
    },
  ]],
]);

const REACT_ISLAND_GATES: GateRow[] = onIsland(['react'], [
  ...[
    'ContactIsland.tsx',
    'ContactIsland.test.tsx',
  ]
    .flatMap((name): GateRow[] => {
      const rows: GateRow[] = [
        [`src/views/contact/${name}`, [{ languages: [undefined] }]],
        [`src/views/contact/${name}@i18n`, [{ languages: ANSWERED }]],
      ];

      return rows;
    }),
  ['src/views/contact/ContactPage.tsx@i18n', [{ languages: ANSWERED }]],
  ['src/views/contact/ContactPage.test.tsx@i18n', [{ languages: ANSWERED }]],
  ['src/views/contact/use-contact-form/useContactForm.ts@react-hook-form', [{ form: ['react-hook-form'] }]],
  ['src/views/contact/use-contact-form/useContactForm.ts@tanstack-form', [{ form: ['tanstack-form'] }]],
  ['__mocks__/WithProviders.tsx@react', [{ testing: ['vitest'] }]],
]);

const VUE_ISLAND_GATES: GateRow[] = onIsland(['vue'], [
  ...[
    'ContactIsland.vue',
    'ContactIsland.test.ts',
    'ContactView.test.ts',
  ]
    .flatMap((name): GateRow[] => {
      const rows: GateRow[] = [
        [`src/views/contact/${name}`, [{ languages: [undefined] }]],
        [`src/views/contact/${name}@i18n`, [{ languages: ANSWERED }]],
      ];

      return rows;
    }),
  ['src/views/contact/ContactView.vue', [{ languages: [undefined], mocking: [undefined] }]],
  ['src/views/contact/ContactView.vue@msw', [{ languages: [undefined], mocking: ['msw'] }]],
  ['src/views/contact/ContactView.vue@i18n', [{ languages: ANSWERED }]],
  ...islandGates('app-button/AppButton', 'vue'),
  ['src/lib/providers/data/dataProvider.ts', NOT_TANSTACK_QUERY],
  ['src/lib/providers/data/dataProvider.ts@tanstack-query', TANSTACK_QUERY],
  ['src/lib/providers/data/dataProvider.test.ts', [{}]],
]);

const SOLID_ISLAND_GATES: GateRow[] = onIsland(['solid'], [
  ...[
    'ContactIsland.tsx',
    'ContactIsland.test.tsx',
  ]
    .flatMap((name): GateRow[] => {
      const rows: GateRow[] = [
        [`src/views/contact/${name}@solid`, [{ languages: [undefined] }]],
        [`src/views/contact/${name}@solid-i18n`, [{ languages: ANSWERED }]],
      ];

      return rows;
    }),
  ['src/views/contact/ContactPage.tsx@solid-i18n', [{ languages: ANSWERED }]],
  ['src/views/contact/ContactPage.test.tsx@msw', [{ languages: [undefined], mocking: ['msw'] }]],
  ['src/views/contact/ContactPage.test.tsx@solid-i18n', [{ languages: ANSWERED }]],
  ['src/views/contact/create-contact-form/createContactForm.ts', [{}]],
  ['src/views/contact/create-contact-form/createContactForm.test.ts', [{}]],
]);

const SVELTE_ISLAND_GATES: GateRow[] = onIsland(['svelte'], [
  ...[
    'ContactIsland.svelte',
    'ContactIsland.test.ts',
  ]
    .flatMap((name): GateRow[] => {
      const rows: GateRow[] = [
        [`src/views/contact/${name}@svelte`, [{ languages: [undefined] }]],
        [`src/views/contact/${name}@svelte-i18n`, [{ languages: ANSWERED }]],
      ];

      return rows;
    }),
  ['src/views/contact/ContactPage.svelte', [{ languages: [undefined], mocking: [undefined] }]],
  ['src/views/contact/ContactPage.svelte@msw', [{ languages: [undefined], mocking: ['msw'] }]],
  ['src/views/contact/ContactPage.svelte@svelte-i18n', [{ languages: ANSWERED }]],
  ['src/views/contact/ContactPage.test.ts', [{ languages: [undefined] }]],
  ['src/views/contact/ContactPage.test.ts@svelte-i18n', [{ languages: ANSWERED }]],
  ...islandGates('button/Button', 'svelte'),
  ['src/lib/providers/data/DataProvider.svelte', NOT_TANSTACK_QUERY],
  ['src/lib/providers/data/DataProvider.svelte@tanstack-query', TANSTACK_QUERY],
  ['__mocks__/WithContactForm.svelte', [{ testing: ['vitest'] }]],
  ['__mocks__/ContactFormProbe.svelte', [{ testing: ['vitest'] }]],
  ['__mocks__/WithData.svelte', [
    { testing: ['vitest'], languages: [undefined] },
    { testing: ['vitest'], data: [undefined] },
  ]],
  ['__mocks__/ContactApiProbe.svelte', [{ testing: ['vitest'], data: [undefined] }]],
  ['__mocks__/WithPhrase.svelte@svelte-i18n', [{ testing: ['vitest'], languages: ANSWERED }]],
]);

const GATES: GateRow[] = [
  ...mswGates(false)
    .filter(([key]) => {
      return key !== '__mocks__/msw/handlers.ts';
    }),
  ['__mocks__/msw/handlers.ts', NO_ISLAND
    .map((condition) => {
      const msw: Condition = {
        ...condition,
        mocking: ['msw'],
      };

      return msw;
    })],
  ['src/config/routes.ts', NO_ISLAND],
  ...SHARED_ISLAND_GATES,
  ...JSX_ISLAND_GATES,
  ...REACT_ISLAND_GATES,
  ...VUE_ISLAND_GATES,
  ...SOLID_ISLAND_GATES,
  ...SVELTE_ISLAND_GATES,
  ...onIsland([
    'react',
    'solid',
    'svelte',
  ], BUTTON_SHEET_GATES),
  ...onIsland(['vue'], [
    ...sheetGates('app-button/AppButton'),
    ['src/components/ui/app-button/AppButton.test.ts', [{}]],
  ]),
  ...onIsland(['react', 'solid'], [
    ['src/components/ui/button/Button.test.tsx', [{}]],
    ['src/components/ui/text-input/TextInput.test.tsx', [{}]],
  ]),
  ...onIsland(['svelte'], [['src/components/ui/button/Button.test.ts', [{}]]]),
  ...onIsland(['vue', 'svelte'], [['src/components/ui/text-input/TextInput.test.ts', [{}]]]),
  ['src/lib/apis/contact/contactApi.test.ts', [
    {
      form: ANSWERED,
      hostedFramework: ['vue', 'solid'],
    },
    {
      form: ANSWERED,
      hostedFramework: ['svelte'],
      data: [undefined],
    },
  ]],
  ...onIsland([
    'react',
    'vue',
    'svelte',
  ], [['src/views/contact/use-contact-form/useContactForm.test.ts', [{}]]]),
  ...onIsland(['vue', 'svelte'], [
    ['src/views/contact/use-contact-form/useContactForm.ts', [{}]],
    ['src/components/ui/text-input/types.ts', [{}]],
  ]),
  ...componentStyleGates(['mark/Mark']),
  ['src/styles/theme.css@tailwind', TAILWIND],
  ['src/layouts/Layout.astro', [{ styling: [undefined, 'tailwind'], languages: [undefined] }]],
  ['src/layouts/Layout.astro@i18n', [{ styling: [undefined, 'tailwind'], languages: ANSWERED }]],
  ['src/layouts/Layout.astro@stylex', [{ styling: ['stylex'], languages: [undefined] }]],
  ['src/layouts/Layout.astro@stylex-i18n', [{ styling: ['stylex'], languages: ANSWERED }]],
  ...BILINGUAL_PATHS
    .flatMap((key): GateRow[] => {
      const rows: GateRow[] = [[key, WITHOUT_I18N], [`${key}@i18n`, WITH_I18N]];

      return rows;
    }),
  ...I18N_ONLY_PATHS
    .map((key): GateRow => {
      const row: GateRow = [`${key}@i18n`, WITH_I18N];

      return row;
    }),
];

describe('the starter gates', () => {
  it('write at most one spelling of each destination under any answer set', () => {
    const walk = walkGates(astroTarget, 'astro');
    expect(walk.twice).toEqual([]);
  });

  it('are each pinned below, and nothing else is', () => {
    const walk = walkGates(astroTarget, 'astro');
    const actual = byKey(GATES);
    expect(actual).toEqual(walk.gated);
  });

  it('each write exactly under the conditions pinned below', () => {
    const walk = walkGates(astroTarget, 'astro');
    const mismatches = walk.mismatchesOf(GATES);
    expect(mismatches).toEqual([]);
  });
});

describe('the favicon', () => {
  it('is the shared Mark, served from where the framework serves a static icon', () => {
    const { starterFiles } = recordFor();
    const favicon = starterFiles
      .find((file) => {
        return file.target === 'public/favicon.svg';
      });

    const expected = {
      target: 'public/favicon.svg',
      shared: true,
    };
    expect(favicon).toEqual(expected);
  });
});

describe('the status pages', () => {
  it('writes a 403, a 404 and a 500 page under every answer set', () => {
    const { starterFiles } = recordFor();
    const pages = starterFiles
      .filter((file) => {
        return /^src\/pages\/\d{3}\.astro$/u.test(file.target);
      });

    const expected = [
      { target: 'src/pages/403.astro' },
      { target: 'src/pages/404.astro' },
      { target: 'src/pages/500.astro' },
    ];
    expect(pages).toEqual(expected);
  });
});

describe('the contact page', () => {
  it('is absent when no framework is hosted, since nothing could render the form', () => {
    const { starterFiles, starterTests } = recordFor();
    const picked = pickedBy([...starterFiles, ...starterTests], { form: 'tanstack-form' });

    const contact = picked
      .filter((entry) => {
        return entry.includes('contact') || entry.includes('with-form');
      });
    expect(contact).toEqual([]);
  });
});
