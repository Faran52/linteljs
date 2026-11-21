import {
  SORT_MARK,
  SORT_SWAPPED,
  SORT_SWAPS,
} from '../constants';

import { type ImportEntry, localsOf } from './bindingUtils';

// Groups of regular expression sources, as `simple-import-sort` takes them: the longest match places an import.
export type ImportGroups = readonly (readonly string[])[];

// Where an import sorts: its group, then the pattern of that group that took it.
interface Place {
  group: number;
  pattern: number;
  matched: number;
}

interface Placed {
  entry: ImportEntry;
  place: Place;
}

// The source `simple-import-sort` matches: marked in front for a side-effect import, behind for a type import.
const sourceOf = (entry: ImportEntry): string => {
  if (entry.isBare) {
    return SORT_MARK + entry.specifier;
  }

  return entry.isType ? entry.specifier + SORT_MARK : entry.specifier;
};

const NO_MATCH = -1;

const placeOf = (entry: ImportEntry, groups: ImportGroups): Place => {
  const source = sourceOf(entry);
  const places = groups
    .flatMap((patterns, group) => {
      return patterns
        .map((written, pattern) => {
          const match = new RegExp(written, 'u').exec(source);
          const place: Place = {
            group,
            pattern,
            matched: match === null ? NO_MATCH : match[0].length,
          };

          return place;
        });
    });
  // An import no pattern takes comes last.
  const unplaced: Place = {
    group: groups.length,
    pattern: 0,
    matched: NO_MATCH,
  };

  return places
    .reduce((best, place) => {
      return place.matched > best.matched ? place : best;
    }, unplaced);
};

const sortKeyOf = (entry: ImportEntry): string => {
  return entry.specifier
    .replaceAll(/[./_-]/gu, (character) => {
      const slot = SORT_SWAPPED.indexOf(character);

      return SORT_SWAPS.charAt(slot);
    });
};

// A namespace import shares a line with a default one at most, so it never joins the named imports.
const keyOf = (entry: ImportEntry): string => {
  const parts = [
    entry.specifier,
    String(entry.isType),
    String(entry.isBare),
    String(entry.namespaceName !== undefined),
    entry.attributes ?? '',
  ];

  return parts.join('\n');
};

const emptyLike = (entry: ImportEntry): ImportEntry => {
  const empty: ImportEntry = {
    specifier: entry.specifier,
    isType: entry.isType,
    isBare: entry.isBare,
    names: new Map(),
    typeNames: new Set(),
  };

  if (entry.attributes !== undefined) {
    empty.attributes = entry.attributes;
  }

  return empty;
};

const isWritten = (entry: ImportEntry): boolean => {
  const hasSingle = entry.defaultName !== undefined || entry.namespaceName !== undefined;

  return entry.isBare || hasSingle || entry.names.size > 0;
};

// The locals the imports of one kind bind: a value import's own type-marked names are not values.
const localsOfKind = (entries: readonly ImportEntry[], isType: boolean): Set<string> => {
  const locals = entries
    .filter((entry) => {
      return entry.isType === isType;
    })
    .flatMap((entry) => {
      return localsOf(entry)
        .filter((local) => {
          return !entry.typeNames.has(local);
        });
    });

  return new Set(locals);
};

// The one local a module is imported whole under, default or namespace: two would leave one of them unbound.
const wholeOf = (specifier: string, known: string | undefined, local: string): string => {
  if (known !== undefined && known !== local) {
    throw new Error(`${specifier} is imported whole as "${known}" and as "${local}"; import it under one name.`);
  }

  return local;
};

// One entry per module and kind, holding only the names the composed body reads: a local imported as a value
// anywhere is written as a value only, and one a type import binds is never also marked `type` in a value import.
const merged = (entries: readonly ImportEntry[], read: ReadonlySet<string>): ImportEntry[] => {
  const byKey = new Map<string, ImportEntry>();
  const values = localsOfKind(entries, false);
  const types = localsOfKind(entries, true);

  const isTaken = (entry: ImportEntry, local: string | undefined): local is string => {
    if (local === undefined || !read.has(local)) {
      return false;
    }

    if (entry.isType) {
      return !values.has(local);
    }

    return !entry.typeNames.has(local) || (!values.has(local) && !types.has(local));
  };

  for (const entry of entries) {
    const key = keyOf(entry);
    const known = byKey.get(key) ?? emptyLike(entry);
    const { defaultName, namespaceName } = entry;

    for (const [local, exported] of entry.names) {
      if (isTaken(entry, local)) {
        known.names.set(local, exported);
      }

      if (isTaken(entry, local) && entry.typeNames.has(local)) {
        known.typeNames.add(local);
      }
    }

    if (isTaken(entry, defaultName)) {
      known.defaultName = wholeOf(entry.specifier, known.defaultName, defaultName);
    }

    if (isTaken(entry, namespaceName)) {
      known.namespaceName = wholeOf(entry.specifier, known.namespaceName, namespaceName);
    }

    byKey.set(key, known);
  }

  const all = [...byKey.values()];

  return all.filter(isWritten);
};

const MAX_INLINE = 2;

// The named imports: up to two on the line, more than two broken, one per line.
const namedOf = (entry: ImportEntry): string[] => {
  const pairs = [...entry.names.entries()];
  const names = pairs
    .toSorted(([left], [right]) => {
      return left.localeCompare(right);
    })
    .map(([local, exported]) => {
      const name = local === exported ? local : `${exported} as ${local}`;

      return entry.typeNames.has(local) ? `type ${name}` : name;
    });
  const lines = names
    .map((name) => {
      return `  ${name},`;
    });
  const clause = names.length > MAX_INLINE ? `{\n${lines.join('\n')}\n}` : `{ ${names.join(', ')} }`;

  const written = [clause];

  return names.length === 0 ? [] : written;
};

const lineOf = (entry: ImportEntry): string => {
  const attributes = entry.attributes === undefined ? '' : ` ${entry.attributes}`;

  if (entry.isBare) {
    return `import '${entry.specifier}'${attributes};`;
  }

  const namespace = entry.namespaceName === undefined ? [] : [`* as ${entry.namespaceName}`];
  const leading = entry.defaultName === undefined ? [] : [entry.defaultName];
  const named = namedOf(entry);
  const clause = [
    ...leading,
    ...namespace,
    ...named,
  ].join(', ');
  const keyword = entry.isType ? 'import type' : 'import';

  return `${keyword} ${clause} from '${entry.specifier}'${attributes};`;
};

const byPlace = (left: Placed, right: Placed): number => {
  const leftKey = sortKeyOf(left.entry);
  const rightKey = sortKeyOf(right.entry);
  const byKey = leftKey.localeCompare(rightKey, 'en', {
    sensitivity: 'base',
    numeric: true,
  });

  return left.place.group - right.place.group || left.place.pattern - right.place.pattern || byKey;
};

// The import block of a composed file: derived, grouped and ordered as the project's lint sorts it.
export const importBlock = (
  entries: readonly ImportEntry[],
  read: ReadonlySet<string>,
  groups: ImportGroups,
): string => {
  const placed = merged(entries, read)
    .map((entry) => {
      const item: Placed = {
        entry,
        place: placeOf(entry, groups),
      };

      return item;
    })
    .toSorted(byPlace);
  const grouped = Map.groupBy(placed, ({ place }) => {
    return place.group;
  });

  const blocks = Array.from(grouped.values());

  return blocks
    .map((group) => {
      return group
        .map(({ entry }) => {
          return lineOf(entry);
        })
        .join('\n');
    })
    .join('\n\n');
};
