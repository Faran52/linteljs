import type { I18nParts } from '../types';
import type { AccessorNames } from '../utils/mockUtils';

export const ALWAYS: readonly string[] = [
  'src/app.html',
  'src/app.d.ts',
  'src/routes/+error.svelte',
  'src/components/ui/mark/Mark.svelte',
];

export const SHARED: readonly string[] = [
  'src/styles/tokens.css',
  'src/styles/base.css',
];

// Each ships a translated twin.
export const TRANSLATED: readonly string[] = [
  'src/routes/about/+page.svelte',
  'src/routes/version/+page.svelte',
  'src/components/features/app-header/AppHeader.svelte',
  'src/components/features/status-page/StatusPage.svelte',
];

// Written with a language alone, without their extension, since each takes a suite.
export const I18N_ONLY: readonly string[] = [
  'src/components/features/language-select/LanguageSelect',
  'src/components/ui/code-text/CodeText',
];

export const ACCESSORS: AccessorNames = {
  directory: 'src/lib/hooks',
  query: 'createExtendedQuery',
  mutation: 'createExtendedMutation',
  testSuffix: '.test.ts',
};

// Paraglide compiles the shared locales into typed message functions. The kit's generated directory
// is already ignored by git, lint and coverage. Declarations, or the Svelte parser reads the emitted JavaScript.
const PARAGLIDE = {
  project: './project.inlang',
  outdir: './.svelte-kit/paraglide',
};

export const SVELTE_I18N: I18nParts = {
  dependencies: [],
  compiler: {
    command: [
      'paraglide-js compile',
      `--project ${PARAGLIDE.project}`,
      `--outdir ${PARAGLIDE.outdir}`,
      '--strategy baseLocale',
      '--emit-ts-declarations',
    ].join(' '),
    devDependencies: ['@inlang/paraglide-js', '@inlang/plugin-message-format'],
    vitePlugin: {
      imports: ["import { paraglideVitePlugin } from '@inlang/paraglide-js';"],
      calls: [
        [
          'paraglideVitePlugin({',
          `      project: '${PARAGLIDE.project}',`,
          `      outdir: '${PARAGLIDE.outdir}',`,
          "      strategy: ['baseLocale'],",
          '      emitTsDeclarations: true,',
          '    })',
        ].join('\n'),
      ],
    },
  },
};
