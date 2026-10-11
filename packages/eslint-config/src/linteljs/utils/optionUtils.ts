import {
  ERROR_PREFIX,
  HOSTS,
  OPTION_NAMES,
  OPTION_VALUES,
  SUGGESTION_DISTANCE,
  WXT_ISLANDS,
} from '../constants';

import type { LinteljsOptions } from '../../types';

type OptionValue = LinteljsOptions[keyof LinteljsOptions];

const VALUES = new Map(Object.entries(OPTION_VALUES));

const isOptionName = (name: string): name is keyof LinteljsOptions => {
  return Object.hasOwn(OPTION_NAMES, name);
};

export const editDistance = (from: string, to: string): number => {
  let previous = Array.from({ length: to.length + 1 }, (_, index) => {
    return index;
  });
  let distance = to.length;

  const fromChars = Array.from(from);

  for (const [row, fromChar] of fromChars.entries()) {
    let diagonal = row;
    let left = row + 1;
    const current = [left];

    for (const [column, above] of previous
      .slice(1)
      .entries()) {
      left = Math.min(above + 1, left + 1, diagonal + (fromChar === to[column] ? 0 : 1));
      diagonal = above;
      current.push(left);
    }

    previous = current;
    distance = left;
  }

  return distance;
};

const hint = (value: string, names: string[]): string => {
  const [closest] = names
    .toSorted((left, right) => {
      return editDistance(value, left) - editDistance(value, right);
    });

  if (closest !== undefined && editDistance(value, closest) <= SUGGESTION_DISTANCE) {
    return ` Did you mean '${closest}'?`;
  }

  return ` Expected one of: ${names.join(', ')}.`;
};

const checkValue = (name: string, value: OptionValue, allowed: string[]): void => {
  if (typeof value === 'string' && allowed.includes(value)) {
    return;
  }

  const shown = JSON.stringify(value);
  const suggestion = hint(typeof value === 'string' ? value : shown, allowed);

  throw new Error(`${ERROR_PREFIX} ${name} cannot be ${shown}.${suggestion}`);
};

const checkNames = (options: LinteljsOptions): void => {
  const names = Object.keys(OPTION_NAMES);

  for (const name of Object.keys(options)) {
    if (!isOptionName(name)) {
      throw new Error(`${ERROR_PREFIX} unknown option '${name}'.${hint(name, names)}`);
    }

    const value = options[name];
    const allowed = VALUES.get(name);
    const entries = Array.isArray(value) ? value : [value];

    if (allowed !== undefined && value !== undefined) {
      for (const entry of entries) {
        checkValue(name, entry, allowed);
      }
    }
  }
};

// Throws on what TypeScript would refuse, for a config written in JavaScript or typed loosely.
export const checkOptions = (options: LinteljsOptions): void => {
  checkNames(options);

  const {
    framework,
    islands,
    styling,
    tailwind,
  } = options;

  if (islands !== undefined && (framework === undefined || !HOSTS.includes(framework))) {
    throw new Error(`${ERROR_PREFIX} islands needs framework 'astro' or 'wxt', not ${JSON.stringify(framework)}.`);
  }

  if (framework === 'wxt' && islands !== undefined) {
    if (islands.length > 1) {
      const count = String(islands.length);

      throw new Error(`${ERROR_PREFIX} framework 'wxt' hosts one island, not ${count}.`);
    }

    for (const island of islands) {
      checkValue('wxt islands', island, WXT_ISLANDS);
    }
  }

  if (tailwind !== undefined && styling !== 'tailwind') {
    throw new Error(`${ERROR_PREFIX} tailwind needs styling 'tailwind'.`);
  }
};
