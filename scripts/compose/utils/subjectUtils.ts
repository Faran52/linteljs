import { readdirSync } from 'node:fs';
import {
  basename,
  dirname,
  extname,
  join,
  relative,
} from 'node:path';

import type {
  Parameter,
  Subject,
  Variant,
} from './composeUtils.ts';

// The question and value folders between the shell and the composed path; `base/` carries none.
const pairSegments = (shipped: string, segments: readonly string[]): readonly string[] => {
  if (segments.length === 1 && segments[0] === 'base') {
    return [];
  }

  if (segments.length % 2 === 1) {
    throw new Error(`${shipped}: its folders above the composed path are not question and value pairs`);
  }

  return segments;
};

const valueOf = (segments: readonly string[], question: string): string | undefined => {
  const index = segments
    .findIndex((segment, at) => {
      return at % 2 === 0 && segment === question;
    });

  return index === -1 ? undefined : segments[index + 1];
};

const optionFile = (
  shipped: string,
  specifier: string,
  parameter: Parameter,
  value: string,
  sourceNames: readonly string[],
): string => {
  if (parameter.files !== undefined) {
    const file = parameter.files[value];

    if (file === undefined || !sourceNames.includes(file)) {
      throw new Error(`${shipped}: no option file for ${specifier} at ${parameter.question} ${value}`);
    }

    return file;
  }

  const stem = `${basename(specifier)}.${value}`;
  const matches = sourceNames
    .filter((name) => {
      return name.slice(0, name.length - extname(name).length) === stem;
    });
  const [file] = matches;

  if (file === undefined || matches.length > 1) {
    throw new Error(`${shipped}: no single ${stem} option file for ${specifier}`);
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

// Every file under the subject's shell that ends in its path and carries its `where` values, by `shipped`.
export const subjectVariants = (subject: Subject, shellsDir: string, sourcesDir: string): Variant[] => {
  const suffix = `/${subject.path}`;
  const basePath = join(sourcesDir, subject.base);
  const sourceNames = readdirSync(dirname(basePath));
  const shellDir = join(shellsDir, subject.shell);
  const variants = readdirSync(shellDir, { recursive: true, withFileTypes: true })
    .filter((entry) => {
      return entry.isFile();
    })
    .map((entry) => {
      const path = join(entry.parentPath, entry.name);
      const shipped = relative(shellsDir, path);

      return shipped;
    })
    .filter((shipped) => {
      return shipped.endsWith(suffix);
    })
    .map((shipped) => {
      const segments = shipped
        .slice(0, shipped.length - suffix.length)
        .split('/')
        .slice(1);

      const pairs = pairSegments(shipped, segments);
      const variant = variantOf(subject, shipped, pairs, sourceNames);

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
