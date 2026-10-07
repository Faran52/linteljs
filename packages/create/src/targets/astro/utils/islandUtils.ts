import { keysOf } from '@utils/objectUtils';

import { CONTACT_HOOK_FORMS } from '../../constants';
import { CONTACT_PAGE } from '../../react/constants';
import {
  hasForm,
  hasI18n,
  starterApplies,
} from '../../utils/gateUtils';
import { translated } from '../../utils/i18nUtils';
import {
  contactApiFiles,
  contactFormFiles,
  contactFormTest,
  contactSubmitTests,
  filesAt,
  mocked,
} from '../../utils/starterUtils';
import { componentStyleModules, componentStyles } from '../../utils/styleUtils';
import {
  CONTACT_COPY,
  CONTACT_VIEW,
  ISLAND_COMPONENTS,
  REACT_ISLAND_IMPORT,
  USE_CONTACT_FORM,
} from '../constants';

import type { Answers, TargetId } from '@config/types';
import type {
  ConditionalStyle,
  StarterFile,
  StarterTest,
} from '../../types';

interface Island {
  // The line `pages/contact.astro` imports the island through.
  pageImport: string;
  files: StarterFile[];
  tests: StarterTest[];
}

type IslandHost = keyof typeof ISLAND_COMPONENTS;

const gated = <T extends StarterFile | StarterTest>(on: (answers: Answers) => boolean, files: readonly T[]): T[] => {
  return files
    .map((file): T => {
      const gatedFile: T = {
        ...file,
        when: (answers: Answers) => {
          return on(answers) && starterApplies(file, answers);
        },
      };

      return gatedFile;
    });
};

// A suite beside each file, from the framework's own tree.
const suitesOf = (covered: readonly string[], shared: TargetId): StarterTest[] => {
  return covered
    .map((covers): StarterTest => {
      const test: StarterTest = {
        target: covers
          .replace(/\.(?:ts|vue)$/u, '.test.ts')
          .replace(/\.tsx$/u, '.test.tsx'),
        covers,
        shared,
      };

      return test;
    });
};

const dataProviders = (path: string, shared: TargetId): StarterFile[] => {
  const files: StarterFile[] = [
    {
      target: path,
      when: (answers) => {
        return answers.data !== 'tanstack-query';
      },
      shared,
    },
    {
      target: path,
      when: (answers) => {
        return answers.data === 'tanstack-query';
      },
      variant: 'tanstack-query',
      shared,
    },
  ];

  return files;
};

// React's own contact page, as an island: Astro routes `src/pages/`, so its parts move to `src/views/`.
const reactIsland = (): Island => {
  const { button, textInput } = ISLAND_COMPONENTS.react;

  const island: Island = {
    pageImport: REACT_ISLAND_IMPORT,
    files: [
      ...translated<StarterFile>({ target: `${CONTACT_VIEW}/ContactIsland.tsx` }),
      { target: 'src/components/ui/index.ts' },
      // Under i18n the page reads the words the island hands it; React's own reads react-i18next.
      ...mocked<StarterFile>({
        target: `${CONTACT_VIEW}/ContactPage.tsx`,
        source: `${CONTACT_PAGE}.tsx`,
        when: (answers) => {
          return !hasI18n(answers);
        },
        shared: 'react',
      }),
      {
        target: `${CONTACT_VIEW}/ContactPage.tsx`,
        when: hasI18n,
        variant: 'i18n',
      },
      ...CONTACT_HOOK_FORMS
        .map((form): StarterFile => {
          const file: StarterFile = {
            target: `${CONTACT_VIEW}/${USE_CONTACT_FORM}.ts`,
            source: `src/pages/contact/${USE_CONTACT_FORM}.ts`,
            when: (answers) => {
              return answers.form === form;
            },
            variant: form,
            shared: 'react',
          };

          return file;
        }),
      ...filesAt([`${button}.tsx`, `${textInput}.tsx`], { shared: 'react' }),
      ...dataProviders('src/lib/providers/data/DataProvider.tsx', 'react'),
      ...contactApiFiles({ shared: 'react' }),
    ],
    tests: [
      ...suitesOf([
        `${button}.tsx`,
        `${textInput}.tsx`,
        'src/lib/providers/data/DataProvider.tsx',
      ], 'react'),
      ...['ContactIsland', 'ContactPage']
        .flatMap((name) => {
          return translated<StarterTest>({
            target: `${CONTACT_VIEW}/${name}.test.tsx`,
            covers: `${CONTACT_VIEW}/${name}.tsx`,
          });
        }),
      {
        target: `${CONTACT_VIEW}/${USE_CONTACT_FORM}.test.ts`,
        covers: `${CONTACT_VIEW}/${USE_CONTACT_FORM}.ts`,
      },
    ],
  };

  return island;
};

// Vue's contact view already sits under `src/views/`; only the island and the view it translates are Astro's.
const vueIsland = (): Island => {
  const { button, textInput } = ISLAND_COMPONENTS.vue;
  const fromVue = [
    `${CONTACT_VIEW}/${USE_CONTACT_FORM}.ts`,
    `${button}.vue`,
    `${textInput}.vue`,
  ];
  const view = `${CONTACT_VIEW}/ContactView`;

  const island: Island = {
    pageImport: "import ContactIsland from '@views/contact/ContactIsland.vue';",
    files: [
      ...translated<StarterFile>({ target: `${CONTACT_VIEW}/ContactIsland.vue` }),
      ...mocked<StarterFile>({
        target: `${view}.vue`,
        when: (answers) => {
          return !hasI18n(answers);
        },
        shared: 'vue',
      }),
      {
        target: `${view}.vue`,
        when: hasI18n,
        variant: 'i18n',
      },
      ...filesAt([...fromVue, 'src/components/ui/text-input/types.ts'], { shared: 'vue' }),
      ...dataProviders('src/lib/providers/data/dataProvider.ts', 'vue'),
      ...contactApiFiles({ query: 'vue' }),
    ],
    tests: [
      ...suitesOf([
        ...fromVue,
        'src/lib/apis/contact/contactApi.ts',
        'src/lib/providers/data/dataProvider.ts',
      ], 'vue'),
      ...translated<StarterTest>({
        target: `${CONTACT_VIEW}/ContactIsland.test.ts`,
        covers: `${CONTACT_VIEW}/ContactIsland.vue`,
      }),
      {
        target: `${view}.test.ts`,
        covers: `${view}.vue`,
        when: (answers) => {
          return !hasI18n(answers);
        },
        shared: 'vue',
      },
      {
        target: `${view}.test.ts`,
        covers: `${view}.vue`,
        when: hasI18n,
        variant: 'i18n',
      },
    ],
  };

  return island;
};

// Solid's own contact page and its form, moved to `src/views/`; Solid's i18n library is not Astro's, so under i18n
// the island hands its page the words.
const solidIsland = (): Island => {
  const { button, textInput } = ISLAND_COMPONENTS.solid;
  const form = 'create-contact-form/createContactForm';

  const ownI18n = <T extends StarterFile | StarterTest>(file: T): T[] => {
    const halves: T[] = [
      {
        ...file,
        when: (answers: Answers) => {
          return !hasI18n(answers);
        },
        variant: 'solid',
      },
      {
        ...file,
        when: hasI18n,
        variant: 'solid-i18n',
      },
    ];

    return halves;
  };

  const fromSolid = <T extends StarterFile | StarterTest>(name: string, file: T): T[] => {
    return mocked<T>({
      ...file,
      source: `src/pages/contact/${name}`,
      when: (answers: Answers) => {
        return !hasI18n(answers);
      },
      shared: 'solid',
    });
  };

  const island: Island = {
    pageImport: REACT_ISLAND_IMPORT,
    files: [
      ...ownI18n<StarterFile>({ target: `${CONTACT_VIEW}/ContactIsland.tsx` }),
      ...fromSolid<StarterFile>('ContactPage.tsx', { target: `${CONTACT_VIEW}/ContactPage.tsx` }),
      {
        target: `${CONTACT_VIEW}/ContactPage.tsx`,
        when: hasI18n,
        variant: 'solid-i18n',
      },
      {
        target: `${CONTACT_VIEW}/${form}.ts`,
        source: `src/pages/contact/${form}.ts`,
        shared: 'solid',
      },
      { target: 'src/components/ui/index.ts' },
      ...filesAt([`${button}.tsx`, `${textInput}.tsx`], { shared: 'solid' }),
      ...dataProviders('src/lib/providers/data/DataProvider.tsx', 'solid'),
      ...contactApiFiles({
        shared: 'solid',
        barrel: 'solid',
      }),
    ],
    tests: [
      ...suitesOf([
        `${button}.tsx`,
        `${textInput}.tsx`,
        'src/lib/providers/data/DataProvider.tsx',
        'src/lib/apis/contact/contactApi.ts',
      ], 'solid'),
      ...ownI18n<StarterTest>({
        target: `${CONTACT_VIEW}/ContactIsland.test.tsx`,
        covers: `${CONTACT_VIEW}/ContactIsland.tsx`,
      }),
      ...fromSolid<StarterTest>('ContactPage.test.tsx', {
        target: `${CONTACT_VIEW}/ContactPage.test.tsx`,
        covers: `${CONTACT_VIEW}/ContactPage.tsx`,
      }),
      {
        target: `${CONTACT_VIEW}/ContactPage.test.tsx`,
        covers: `${CONTACT_VIEW}/ContactPage.tsx`,
        when: hasI18n,
        variant: 'solid-i18n',
      },
      {
        target: `${CONTACT_VIEW}/${form}.test.ts`,
        covers: `${CONTACT_VIEW}/${form}.ts`,
        source: `src/pages/contact/${form}.test.ts`,
        shared: 'solid',
      },
    ],
  };

  return island;
};

const ISLANDS: Record<IslandHost, () => Island> = {
  react: reactIsland,
  vue: vueIsland,
  solid: solidIsland,
};

// Svelte's island is still to come, so a project hosting it has no contact page.
export const hasIsland = (answers: Answers): boolean => {
  const host = answers.hostedFramework;

  return hasForm(answers) && host !== undefined && Object.hasOwn(ISLANDS, host);
};

const hosts = (host: IslandHost) => {
  return (answers: Answers): boolean => {
    return hasForm(answers) && answers.hostedFramework === host;
  };
};

export const islandFiles = (): StarterFile[] => {
  const own = keysOf(ISLANDS)
    .flatMap((host) => {
      const { pageImport, files } = ISLANDS[host]();
      const components = ISLAND_COMPONENTS[host];
      const pages = translated<StarterFile>({
        target: 'src/pages/contact.astro',
        transform: (source) => {
          return source.replace(REACT_ISLAND_IMPORT, pageImport);
        },
      })
        .flatMap(mocked);

      const gatedFiles = gated(hosts(host), [
        ...pages,
        ...files,
        ...componentStyles(components),
        // Astro's own modules already bring the StyleX tokens.
        ...componentStyleModules(host === 'react' ? 'react' : 'solid', components)
          .filter(({ variant, target }) => {
            return variant !== 'stylex' || !target.startsWith('src/styles/');
          }),
      ]);

      return gatedFiles;
    });

  const all = [
    ...own,
    ...gated(hasIsland, [
      {
        target: `${CONTACT_COPY}.ts`,
        when: hasI18n,
        variant: 'i18n',
      },
      ...contactFormFiles(),
      {
        target: 'src/config/routes.ts',
        variant: 'with-form',
        shared: true,
      },
    ]),
  ];

  return all;
};

export const islandTests = (): StarterTest[] => {
  const own = keysOf(ISLANDS)
    .flatMap((host) => {
      const gatedTests = gated(hosts(host), ISLANDS[host]().tests);

      return gatedTests;
    });

  const all = [
    ...own,
    ...gated(hasIsland, [
      {
        target: `${CONTACT_COPY}.test.ts`,
        covers: `${CONTACT_COPY}.ts`,
        when: hasI18n,
        variant: 'i18n',
      },
      contactFormTest(),
      ...contactSubmitTests(),
    ]),
  ];

  return all;
};

// Each island's button and text input sheets, under its own host.
export const islandSheets = (): ConditionalStyle[] => {
  return keysOf(ISLAND_COMPONENTS)
    .flatMap((host) => {
      return Object.values(ISLAND_COMPONENTS[host])
        .map((path): ConditionalStyle => {
          const sheet: ConditionalStyle = {
            path: `${path.replace(/^src\//u, '../')}.css`,
            when: hosts(host),
          };

          return sheet;
        });
    });
};
