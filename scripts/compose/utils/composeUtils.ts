import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { type ComposeRequest, moduleCompose } from '../../../packages/compose/src/module/moduleCompose.ts';

export type ImportGroups = NonNullable<ComposeRequest['importGroups']>;

export interface Variant {
  // A parameter module's specifier, as the base imports it, to the option file beside the base.
  readonly options: Readonly<Record<string, string>>;
  // The composed file, under `shells/`.
  readonly shipped: string;
}

export interface Parameter {
  // The question folder whose value picks the option.
  readonly question: string;
  // A value to its option file, where that file is not `<parameter>.<value>.<ext>` beside the base.
  readonly files?: Readonly<Record<string, string>>;
}

export interface Subject {
  // The folder under `shells/`.
  readonly shell: string;
  // The composed file's path below its question and value folders.
  readonly path: string;
  // The question values a shipped path carries to belong to this subject.
  readonly where?: Readonly<Record<string, string>>;
  // The base module, under `codegen/compose-sources/`.
  readonly base: string;
  // A specifier the base imports to the question its option follows.
  readonly parameters: Readonly<Record<string, Parameter>>;
  readonly groups: ImportGroups;
  readonly plainData: readonly string[];
  readonly pureCalls: readonly string[];
  // A specifier the base or an option imports to its file under `codegen/compose-sources/`.
  readonly modules: Readonly<Record<string, string>>;
}

const readText = (path: string): string => {
  return readFileSync(path, 'utf8');
};

export const composedText = (subject: Subject, variant: Variant, sourcesDir: string): string => {
  const basePath = join(sourcesDir, subject.base);
  const baseDir = dirname(basePath);
  const optionEntries = Object.entries(variant.options)
    .map(([specifier, name]) => {
      const path = join(baseDir, name);
      const option: [string, string] = [specifier, readText(path)];

      return option;
    });
  const moduleEntries = Object.entries(subject.modules)
    .map(([specifier, name]) => {
      const path = join(sourcesDir, name);
      const module: [string, string] = [specifier, readText(path)];

      return module;
    });
  const base = readText(basePath);

  return moduleCompose({
    base,
    options: Object.fromEntries(optionEntries),
    modules: Object.fromEntries(moduleEntries),
    plainData: subject.plainData,
    pureCalls: subject.pureCalls,
    importGroups: subject.groups,
  });
};
