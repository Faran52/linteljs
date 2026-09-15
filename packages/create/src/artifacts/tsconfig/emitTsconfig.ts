import { targetFor, type TsconfigPlugin } from '../../model/targets';
import { buildAliases } from '../build-aliases/buildAliases';

import type { Answers } from '../../model/answers/answers';

// `noUnusedLocals`/`noUnusedParameters` are absent: `unused-imports` owns that, and both would double-report.

export interface CompilerOptions {
  rootDir: string;
  target: string;
  lib: string[];
  useDefineForClassFields: boolean;
  jsx?: 'react-jsx' | 'preserve';
  jsxImportSource?: string;
  module: string;
  moduleResolution: string;
  resolveJsonModule: boolean;
  allowImportingTsExtensions: boolean;
  isolatedModules: boolean;
  moduleDetection: string;
  importHelpers: boolean;
  verbatimModuleSyntax: boolean;
  noEmit?: boolean;
  incremental: boolean;
  strict: boolean;
  noUncheckedIndexedAccess: boolean;
  exactOptionalPropertyTypes: boolean;
  noImplicitOverride: boolean;
  noFallthroughCasesInSwitch: boolean;
  allowUnreachableCode: boolean;
  allowUnusedLabels: boolean;
  erasableSyntaxOnly?: boolean;
  allowJs: boolean;
  checkJs: boolean;
  skipLibCheck: boolean;
  esModuleInterop: boolean;
  forceConsistentCasingInFileNames: boolean;
  types: string[];
  plugins?: TsconfigPlugin[];
  paths: Record<string, string[]>;
}

export interface TsconfigFile {
  extends?: string;
  compilerOptions: CompilerOptions;
  include: string[];
  exclude: string[];
}

const BASE_INCLUDE = ['**/*.ts', '**/*.tsx', '**/*.mts'];
const BASE_EXCLUDE = ['node_modules', 'dist', 'build', 'coverage'];

// `vite/client` declares `./logo.svg`, `./App.css` and `import.meta.env`, which the starter component uses.
const typesFor = (answers: Answers): string[] => {
  const target = targetFor(answers);

  return [
    'node',
    ...(target.vite ? ['vite/client'] : []),
    // Named, so a project that declined a suite does not typecheck against ambient `describe`.
    ...(answers.testing === 'vitest' ? ['vitest/globals'] : []),
    ...target.tsconfig.types ?? [],
  ];
};

const pathsFrom = (answers: Answers): Record<string, string[]> => {
  return Object.fromEntries(
    Object.entries(buildAliases(answers)).map(([alias, directory]) => {
      return [alias, [directory]];
    }),
  );
};

export const buildTsconfig = (answers: Answers): TsconfigFile => {
  const delta = targetFor(answers).tsconfig;

  return {
    ...(delta.extends === undefined ? {} : { extends: delta.extends }),
    compilerOptions: {
      rootDir: '.',

      target: 'esnext',
      lib: ['dom', 'dom.iterable', 'esnext'],
      // Angular's decorators read fields before the base constructor defines them; [[Define]] wipes them.
      useDefineForClassFields: delta.useDefineForClassFields ?? true,
      ...(delta.jsx === undefined ? {} : { jsx: delta.jsx }),
      ...(delta.jsxImportSource === undefined ? {} : { jsxImportSource: delta.jsxImportSource }),

      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      // Off: `rewriteScaffoldedSource` strips the extensions instead.
      allowImportingTsExtensions: false,
      isolatedModules: true,
      moduleDetection: 'force',
      importHelpers: true,
      verbatimModuleSyntax: true,

      // Absent on Angular: ngtsc emits nothing under it; `typecheck` passes --noEmit on the command line.
      ...(delta.dropsNoEmit === true ? {} : { noEmit: true }),
      incremental: true,

      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      noImplicitOverride: true,
      noFallthroughCasesInSwitch: true,
      // `noPropertyAccessFromIndexSignature` is absent: CSS modules are index signatures, and it failed Next's own
      // starter page eight times. `noUncheckedIndexedAccess` covers the safety half.
      allowUnreachableCode: false,
      allowUnusedLabels: false,
      // Parameter properties are not erasable, and Angular's DI is built on them.
      ...(delta.dropsErasableSyntaxOnly === true ? {} : { erasableSyntaxOnly: true }),
      allowJs: true,
      checkJs: false,
      skipLibCheck: true,

      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,

      types: typesFor(answers),
      ...(delta.plugins === undefined ? {} : { plugins: delta.plugins }),

      paths: pathsFrom(answers),
    },
    include: [...BASE_INCLUDE, ...(delta.include ?? [])],
    exclude: BASE_EXCLUDE,
  };
};

export const emitTsconfig = (answers: Answers): string => {
  return `${JSON.stringify(buildTsconfig(answers), null, 2)}\n`;
};
