import { mapValues } from 'es-toolkit';

import {
  type AliasMap,
  type Answers,
  type Artifact,
} from '@config/types';

import {
  targetFor,
  type TsconfigDelta,
  type TsconfigPlugin,
} from '@targets';

import { TEST_RUNNERS } from '../../constants';
import { buildAliases } from '../../utils/aliasUtils';
import { emitted } from '../../utils/artifactUtils';
import { testRunnerOf } from '../../utils/runnerUtils';

// No `noUnusedLocals`/`noUnusedParameters`: `unused-imports` owns that.

export interface CompilerOptions {
  rootDir: string;
  rootDirs?: string[];
  target: string;
  lib: string[];
  useDefineForClassFields: boolean;
  jsx?: 'react-jsx' | 'preserve';
  jsxImportSource?: string;
  module: string;
  moduleResolution: string;
  resolveJsonModule: boolean;
  allowImportingTsExtensions: boolean;
  rewriteRelativeImportExtensions?: boolean;
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
  erasableSyntaxOnly: boolean;
  allowJs: boolean;
  checkJs: boolean;
  skipLibCheck: boolean;
  esModuleInterop: boolean;
  forceConsistentCasingInFileNames: boolean;
  types: string[];
  plugins?: TsconfigPlugin[];
  paths?: Record<string, string[]>;
}

export interface TsconfigParts {
  delta: TsconfigDelta;
  browser: boolean;
  types: string[];
  aliases: AliasMap;
  include: string[];
}

export interface TsconfigFile {
  extends?: string;
  compilerOptions: CompilerOptions;
  include: string[];
  exclude: string[];
}

const BASE_INCLUDE = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.mts',
];
// The plugin is vendored tooling, typechecked where it is written, and its band imports the engine's `claude-code`.
const BASE_EXCLUDE = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  'plugins/linteljs',
];

// `vite/client` declares `./logo.svg`, `./App.css` and `import.meta.env`.
const typesFor = (answers: Answers): string[] => {
  const target = targetFor(answers);
  const runner = testRunnerOf(answers);

  const types: string[] = [
    'node',
    ...(target.vitePlugin === undefined ? [] : ['vite/client']),
    // Named, so a project that declined a suite does not typecheck against ambient `describe`.
    ...(runner === undefined ? [] : [TEST_RUNNERS[runner].types]),
    ...target.tsconfig.types ?? [],
  ];

  return types;
};

const pathsFrom = (aliases: AliasMap): Record<string, string[]> => {
  return mapValues(aliases, (directory) => {
    const locations: string[] = [directory];

    return locations;
  });
};

const compilerOptionsFor = (parts: TsconfigParts): CompilerOptions => {
  const { delta } = parts;

  const compilerOptions: CompilerOptions = {
    rootDir: '.',
    ...(delta.rootDirs === undefined ? {} : { rootDirs: delta.rootDirs }),

    target: 'esnext',
    lib: parts.browser
      ? [
          'dom',
          'dom.iterable',
          'esnext',
        ]
      : ['esnext'],
    // Angular's decorators read fields before the base constructor defines them; [[Define]] wipes them.
    useDefineForClassFields: delta.useDefineForClassFields ?? true,
    ...(delta.jsx === undefined ? {} : { jsx: delta.jsx }),
    ...(delta.jsxImportSource === undefined ? {} : { jsxImportSource: delta.jsxImportSource }),

    module: 'esnext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    // Type stripping needs `.ts` specifiers; vue-tsc rejects a `.vue` import under the rewrite.
    allowImportingTsExtensions: delta.dropsNoEmit !== true,
    ...(delta.dropsNoEmit === true ? { rewriteRelativeImportExtensions: true } : {}),
    isolatedModules: true,
    moduleDetection: 'force',
    importHelpers: true,
    verbatimModuleSyntax: true,

    // ngtsc emits nothing under `noEmit`; `typecheck` passes --noEmit on the command line.
    ...(delta.dropsNoEmit === true ? {} : { noEmit: true }),
    incremental: true,

    strict: true,
    noUncheckedIndexedAccess: true,
    exactOptionalPropertyTypes: true,
    noImplicitOverride: true,
    noFallthroughCasesInSwitch: true,
    // No `noPropertyAccessFromIndexSignature`: CSS modules are index signatures; it failed Next's starter 8 times.
    allowUnreachableCode: false,
    allowUnusedLabels: false,
    erasableSyntaxOnly: true,
    allowJs: true,
    checkJs: false,
    skipLibCheck: true,

    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,

    types: parts.types,
    ...(delta.plugins === undefined ? {} : { plugins: delta.plugins }),

    ...(delta.dropsPaths === true ? {} : { paths: pathsFrom(parts.aliases) }),
  };

  return compilerOptions;
};

const tsconfigOf = (parts: TsconfigParts): TsconfigFile => {
  const { delta } = parts;

  const tsconfig: TsconfigFile = {
    ...(delta.extends === undefined ? {} : { extends: delta.extends }),
    compilerOptions: compilerOptionsFor(parts),
    include: [
      ...BASE_INCLUDE,
      ...delta.include ?? [],
      ...parts.include,
    ],
    exclude: BASE_EXCLUDE,
  };

  return tsconfig;
};

export const tsconfigSource = (parts: TsconfigParts): string => {
  const tsconfig = tsconfigOf(parts);

  return `${JSON.stringify(tsconfig, null, 2)}\n`;
};

const partsOf = (answers: Answers): TsconfigParts => {
  const record = targetFor(answers);
  const styled = answers.styling === 'tailwind' ? record.tailwind?.tsconfigInclude ?? [] : [];

  const parts: TsconfigParts = {
    delta: record.tsconfig,
    browser: record.packageProject !== true,
    types: typesFor(answers),
    aliases: buildAliases(answers),
    include: styled,
  };

  return parts;
};

export const buildTsconfig = (answers: Answers): TsconfigFile => {
  const parts = partsOf(answers);

  return tsconfigOf(parts);
};

export const emitTsconfig = (answers: Answers): string => {
  const parts = partsOf(answers);

  return tsconfigSource(parts);
};

export const tsconfigEmitter = (answers: Answers): Artifact[] => {
  const tsconfig = emitTsconfig(answers);
  const artifacts = [emitted('package', 'tsconfig.json', tsconfig)];

  return artifacts;
};
