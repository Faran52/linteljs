import { basename, parse } from 'node:path';

import type { ImportGroups } from '../../utils/importUtils';

export interface Variant {
  // A parameter module's specifier, as the base imports it, to the option file beside the base.
  readonly options: Readonly<Record<string, string>>;
  // The composed file, under `shells/`.
  readonly shipped: string;
}

interface NamedParameter {
  // The question folder whose value picks the option, `<parameter>.<value>.<ext>` beside the base.
  readonly question: string;
  // The value whose option is the default module itself, `<parameter>.<ext>`.
  readonly default?: string;
  readonly files?: never;
}

interface MappedParameter {
  readonly question: string;
  // Every value to its option file, beside the base.
  readonly files: Readonly<Record<string, string>>;
  readonly default?: never;
}

export type Parameter = NamedParameter | MappedParameter;

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

// The question and value folders between the shell and the composed path; `base/` carries none.
const assertPaired = (shipped: string, segments: readonly string[]): void => {
  const isBase = segments.length === 1 && segments[0] === 'base';

  if (!isBase && segments.length % 2 === 1) {
    throw new Error(`${shipped}: its folders above the composed path are not question and value pairs`);
  }
};

const valueOf = (segments: readonly string[], question: string): string | undefined => {
  const index = segments
    .findIndex((segment, at) => {
      return at % 2 === 0 && segment === question;
    });

  return index === -1 ? undefined : segments[index + 1];
};

const namedFiles = (stem: string, sourceNames: readonly string[]): string[] => {
  return sourceNames
    .filter((name) => {
      return parse(name).name === stem;
    });
};

const optionFile = (
  shipped: string,
  specifier: string,
  parameter: Parameter,
  value: string,
  sourceNames: readonly string[],
): string => {
  const { files, question } = parameter;

  if (files !== undefined) {
    const mapped = files[value];

    if (mapped === undefined) {
      throw new Error(`${shipped}: the files of ${specifier} name none for ${question} ${value}`);
    }

    if (!sourceNames.includes(mapped)) {
      throw new Error(`${shipped}: no option file ${mapped} for ${specifier} at ${question} ${value}`);
    }

    return mapped;
  }

  const defaultStem = basename(specifier);
  const ownStem = `${defaultStem}.${value}`;
  const isDefault = value === parameter.default;
  const ownFiles = namedFiles(ownStem, sourceNames);

  if (isDefault && ownFiles.length > 0) {
    throw new Error(`${shipped}: ${specifier} has two sources for ${question} ${value}, its default and ${ownStem}`);
  }

  const stem = isDefault ? defaultStem : ownStem;
  const matches = isDefault ? namedFiles(defaultStem, sourceNames) : ownFiles;
  const [file] = matches;

  if (file === undefined || matches.length > 1) {
    throw new Error(`${shipped}: no single ${stem} option file for ${specifier} at ${question} ${value}`);
  }

  return file;
};

const variantOf = (
  subject: Subject,
  shipped: string,
  segments: readonly string[],
  sourceNames: readonly string[],
): Variant | undefined => {
  const { where } = subject;
  const belongs = where === undefined || Object.entries(where)
    .every(([question, value]) => {
      return valueOf(segments, question) === value;
    });

  if (!belongs) {
    return undefined;
  }

  const options = Object.entries(subject.parameters)
    .map(([specifier, parameter]): [string, string] => {
      const value = valueOf(segments, parameter.question);

      if (value === undefined) {
        throw new Error(`${shipped}: no ${parameter.question} folder for ${specifier}`);
      }

      const file = optionFile(shipped, specifier, parameter, value, sourceNames);
      const option: [string, string] = [specifier, file];

      return option;
    });
  const variant: Variant = { options: Object.fromEntries(options), shipped };

  return variant;
};

// Every shipped path of the subject's shell that ends in its path and carries its `where` values, by `shipped`.
// The paths are under `shells/`, the source names beside the base.
export const subjectVariants = (
  subject: Subject,
  shippedPaths: readonly string[],
  sourceNames: readonly string[],
): Variant[] => {
  const prefix = `${subject.shell}/`;
  const suffix = `/${subject.path}`;
  const variants = shippedPaths
    .filter((shipped) => {
      return shipped.startsWith(prefix) && shipped.endsWith(suffix);
    })
    .map((shipped) => {
      const segments = shipped
        .slice(0, shipped.length - suffix.length)
        .split('/')
        .slice(1);

      assertPaired(shipped, segments);

      const variant = variantOf(subject, shipped, segments, sourceNames);

      return variant;
    })
    .filter((variant) => {
      return variant !== undefined;
    });

  return variants
    .toSorted((left, right) => {
      return left.shipped.localeCompare(right.shipped);
    });
};
