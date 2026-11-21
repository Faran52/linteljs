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

export interface Subject {
  // The base module, under `codegen/compose-sources/`.
  readonly base: string;
  readonly groups: ImportGroups;
  readonly plainData: readonly string[];
  readonly pureCalls: readonly string[];
  // A specifier the base or an option imports to its file under `codegen/compose-sources/`.
  readonly modules: Readonly<Record<string, string>>;
  readonly variants: readonly Variant[];
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
