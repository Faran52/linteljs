import type { I18nParts } from '../types';
import type { AccessorNames } from '../utils/mockUtils';

export const ALWAYS: readonly string[] = [
  'src/app.html',
  'src/routes/+error.svelte',
  'src/components/ui/mark/Mark.svelte',
];

export const SHARED: readonly string[] = [
  'src/styles/tokens.css',
  'src/styles/base.css',
];

// Each ships a translated twin.
export const TRANSLATED: readonly string[] = [
  'src/app.d.ts',
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

// The request's language, detected on the server, and the suite of each.
export const I18N_ONLY_SUITES = [
  ['src/i18n/index.test.ts', 'src/i18n/index.ts'],
  ['src/hooks.server.test.ts', 'src/hooks.server.ts'],
  ['src/routes/layout.server.test.ts', 'src/routes/+layout.server.ts'],
] as const;

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

const PARAGLIDE_COMMAND = [
  'paraglide-js compile',
  `--project ${PARAGLIDE.project}`,
  `--outdir ${PARAGLIDE.outdir}`,
  '--strategy baseLocale',
  '--emit-ts-declarations',
].join(' ');

const PARAGLIDE_PLUGIN_CALL = [
  'paraglideVitePlugin({',
  `      project: '${PARAGLIDE.project}',`,
  `      outdir: '${PARAGLIDE.outdir}',`,
  "      strategy: ['baseLocale'],",
  '      emitTsDeclarations: true,',
  '    })',
].join('\n');

export const SVELTE_I18N: I18nParts = {
  dependencies: [],
  compiler: {
    command: PARAGLIDE_COMMAND,
    devDependencies: ['@inlang/paraglide-js', '@inlang/plugin-message-format'],
    vitePlugin: {
      imports: ["import { paraglideVitePlugin } from '@inlang/paraglide-js';"],
      calls: [PARAGLIDE_PLUGIN_CALL],
    },
  },
};

// The components Svelte's query bindings read their client through.
export const QUERY_CONTEXT_MOCKS = [
  '__mocks__/WithExtendedQuery.svelte',
  '__mocks__/WithExtendedMutation.svelte',
  '__mocks__/ExtendedQueryProbe.svelte',
  '__mocks__/ExtendedMutationProbe.svelte',
] as const;

// The data slot is a component here, so a suite needing it needs one too.
export const FORM_SUITE_MOCKS = [
  '__mocks__/WithData.svelte',
  '__mocks__/WithContactForm.svelte',
  '__mocks__/ContactFormProbe.svelte',
] as const;

export const FORM_FILES = [
  'src/routes/contact/use-contact-form/useContactForm.ts',
  'src/components/ui/text-input/TextInput.svelte',
  'src/components/ui/text-input/types.ts',
] as const;
