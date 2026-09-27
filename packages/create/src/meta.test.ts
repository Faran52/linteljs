import { readFileSync } from 'node:fs';
import {
  basename,
  join,
  relative,
} from 'node:path';

import {
  directoriesIn,
  entriesIn,
  entryNameOf,
  modulesIn,
  sourcesUnder,
  takenFromBarrel,
} from '@mocks/ringShape';
import ts from 'typescript';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { MANAGER_BINARIES, MANAGER_FLOORS } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';
import { BUILD_EMITTERS, SEED_EMITTERS } from '@emitters/registry';
import { TARGETS } from '@targets/registry';

import { type Ring, RINGS } from './rings';

import type { AnswerRecord } from '@answers/types';

interface RingShape {
  name: Ring;
  /**
   * The suffix a subject's entry carries, keyed by the group that decides it. One `''` key is a ring with no group,
   * and an empty string is a ring with no one kind: `terminal/` holds an entrypoint and a questionnaire, so there is
   * nothing to suffix and the entry is named for its directory alone.
   */
  suffixes: Record<string, string>;
  // The keys the subject listing is held against: `<group>/<name>` where those keys carry a group, else `<name>`.
  registry?: () => string[];
  // A ring read by path rather than by subject. It carries a barrel rule only where a barrel exists, which is neither.
  files?: true;
}

interface Subject {
  ring: string;
  group: string;
  name: string;
  path: string;
  entry: string;
  // A registered subject is a value the registry names, so its entry exports it. An unregistered one is a module
  // named for its directory and may export more than one thing: `pipeline/runs/sync/` plans and applies.
  registered: boolean;
}

const srcDir = join(import.meta.dirname);

// `utils/` holds what the ring shares and `e2e/` is the harness rather than the package. Neither is a group or a
// subject, and neither is held to the shape below.
const SHARED = new Set(['utils', 'e2e']);

const kebab = (key: string): string => {
  return key.replace(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase();
};

/**
 * Every ring, the suffix each one's entry takes, and the registry that has to name the same subjects. One table
 * states the rule once, so a tenth ring is one row. `rings.ts` is the list it is held against.
 *
 * A ring is named for what its members are, or for the world it reaches when the world is the membership test. The
 * entry takes the singular of whatever names the kind, which is the ring where the ring has one and the group where
 * a group changes it.
 */
const SHAPES: RingShape[] = [
  {
    name: 'answers',
    suffixes: {
      agents: 'Answer',
      libraries: 'Answer',
      recorded: 'Answer',
      target: 'Answer',
      testing: 'Answer',
      typesafety: 'Answer',
    },
    registry: () => {
      return Object.keys(ANSWERS).map(kebab);
    },
  },
  {
    name: 'config',
    suffixes: {},
    files: true,
  },
  {
    name: 'disk',
    suffixes: {
      read: 'Reader',
      write: 'Writer',
    },
  },
  {
    name: 'emitters',
    suffixes: {
      agents: 'Emitter',
      always: 'Emitter',
      libraries: 'Emitter',
      manager: 'Emitter',
      target: 'Emitter',
      testing: 'Emitter',
      typesafety: 'Emitter',
    },
    registry: () => {
      return [...Object.keys(BUILD_EMITTERS), ...Object.keys(SEED_EMITTERS)];
    },
  },
  {
    name: 'pipeline',
    suffixes: {
      runs: 'Run',
      passes: 'Pass',
    },
  },
  {
    name: 'spawns',
    suffixes: { '': 'Spawn' },
  },
  {
    name: 'targets',
    suffixes: { '': 'Target' },
    registry: () => {
      return Object.keys(TARGETS);
    },
  },
  {
    name: 'terminal',
    suffixes: { '': '' },
  },
  {
    name: 'utils',
    suffixes: {},
    files: true,
  },
];

const subjectsIn = (ring: RingShape): Subject[] => {
  const ringDir = join(srcDir, ring.name);

  return Object.entries(ring.suffixes).flatMap(([group, suffix]) => {
    const groupDir = join(ringDir, group);

    return directoriesIn(groupDir).filter((name) => {
      return !SHARED.has(name) && !(group === '' && name in ring.suffixes);
    }).map((name) => {
      return {
        ring: ring.name,
        group,
        name,
        path: join(groupDir, name),
        entry: entryNameOf(name, suffix),
        registered: ring.registry !== undefined,
      };
    });
  });
};

// A registry keyed by `<group>/<name>` says so in its own keys, so nothing has to declare which spelling it uses.
const keyOf = (subject: Subject, registered: string[]): string => {
  return registered.some((key) => {
    return key.includes('/');
  })
    ? `${subject.group}/${subject.name}`
    : subject.name;
};

const RINGED = SHAPES.filter((ring) => {
  return ring.files === undefined;
});

const packageSources = sourcesUnder(srcDir);

it('holds the same rings as rings.ts', () => {
  expect(SHAPES.map((ring) => {
    return ring.name;
  })).toEqual([...RINGS].toSorted((left, right) => {
    return left.localeCompare(right, 'en');
  }));
});

describe.each(SHAPES.filter((ring) => {
  return ring.files === true;
}))('$name', (ring) => {
  // Two files and one file, read by path. A directory here would be a subject, and a subject would need a registry.
  it('holds no subject', () => {
    expect(directoriesIn(join(srcDir, ring.name))).toEqual([]);
  });
});

describe.each(RINGED)('$name', (ring) => {
  const ringDir = join(srcDir, ring.name);

  it('holds a subject somewhere, so the assertions below are not vacuous', () => {
    expect(subjectsIn(ring).length).toBeGreaterThan(0);
  });

  /**
   * `index.ts` is the ring's public surface: the rings outside it reach it through the barrel rather than into a
   * file. An export nothing out there reads is not a surface, it is a leftover.
   */
  it('exports nothing the rings outside it never take from it', () => {
    const barrel = readFileSync(join(ringDir, 'index.ts'), 'utf8');
    const exported = [...barrel.matchAll(/export \{([^}]*)\} from/gu)].flatMap(([, names]) => {
      return (names ?? '').split(',');
    }).map((name) => {
      return name.replace('type ', '').trim();
    }).filter((name) => {
      return name !== '';
    });

    expect(exported.length).toBeGreaterThan(0);

    const taken = takenFromBarrel(ringDir, ring.name);

    expect(exported.filter((name) => {
      return !taken.has(name);
    })).toEqual([]);
  });
});

describe.each(RINGED.filter((ring) => {
  return ring.registry !== undefined;
}))('$name registry', (ring) => {
  const registered = ring.registry?.() ?? [];
  const keys = subjectsIn(ring).map((subject) => {
    return keyOf(subject, registered);
  });

  // Read off disk rather than probed, so a directory nobody registered is caught as well as the reverse.
  it('names every subject directory', () => {
    expect(keys.filter((key) => {
      return !registered.includes(key);
    })).toEqual([]);
  });

  it('names nothing that is not a subject directory', () => {
    expect(registered.filter((key) => {
      return !keys.includes(key);
    })).toEqual([]);
  });

  it('holds exactly one subject per key', () => {
    expect(keys.filter((key, index) => {
      return keys.indexOf(key) !== index;
    })).toEqual([]);
  });
});

describe.each(RINGED.flatMap(subjectsIn))('$ring/$name', ({ path, entry }) => {
  it('holds one entry, named for the directory', () => {
    expect(entriesIn(path)).toContain(`${entry}.ts`);
  });

  // `index` means a barrel in this package, and a subject directory is not one.
  it('holds no index', () => {
    expect(entriesIn(path)).not.toContain('index.ts');
  });

  /**
   * One entry, its suite, a `constants.ts` for a table it alone owns, and a `utils/` for its private helpers.
   * Nothing else: a second module loose beside the entry is either a helper, in which case `utils/` is where the
   * `*Utils` suffix is enforced on it, or it is read from outside, in which case it is not this subject's.
   *
   * A `constants.ts` carries no suite of its own. Asserting a table equals itself proves nothing, and what is
   * worth checking about one is always a fact about the code that reads it, which is where that assertion goes.
   *
   * One suite, too. A second file for part of a subject means a reader comparing the halves opens two, and the
   * halves drift.
   */
  it('holds nothing but its entry, its constants and a utils directory', () => {
    const allowed = new RegExp(`^(${entry}\\.test\\.ts|${entry}\\.ts|constants\\.ts)$`, 'u');

    expect(entriesIn(path).filter((file) => {
      return file !== 'utils' && !allowed.test(file);
    })).toEqual([]);
  });

  it('suffixes every private helper and puts it under utils', () => {
    expect(modulesIn(path).filter((file) => {
      return file.includes('/') && !/^utils\/[a-z][A-Za-z]*Utils(\.test)?\.ts$/u.test(file);
    })).toEqual([]);
  });

  /**
   * What makes a helper private is that one subject reads it. A second reader means it belongs to the group or to
   * the ring, and `<group>/utils/` or `<ring>/utils/` is where it goes. Checked by reading the import sites,
   * because a helper that quietly gained a second consumer still passes every other assertion here.
   */
  it('keeps every module under its utils private to itself', () => {
    const helpers = modulesIn(path).filter((file) => {
      return file.startsWith('utils/') && !file.endsWith('.test.ts');
    });

    expect(helpers.filter((helper) => {
      const specifier = `${relative(srcDir, path)}/${helper.replace(/\.ts$/u, '')}`;

      return packageSources.some((source) => {
        return !source.startsWith(path) && readFileSync(source, 'utf8').includes(specifier);
      });
    })).toEqual([]);
  });
});

/**
 * A registered subject is a value its registry names, so the entry exports it under the entry's own name; a record
 * annotates its type, so the character after the name is a colon as often as a space. An unregistered subject is a
 * module named for its directory and may export more than one thing: `pipeline/runs/sync/` plans and applies.
 */
describe.each(RINGED.flatMap(subjectsIn).filter((subject) => {
  return subject.registered;
}))('$ring/$name', ({ path, entry }) => {
  it('exports that entry under the same name', () => {
    expect(readFileSync(join(path, `${entry}.ts`), 'utf8')).toMatch(new RegExp(`export const ${entry}[ :]`, 'u'));
  });
});

/**
 * A module-level value that is not a function is a constant, and a module holding more than two is carrying a table
 * its readers cannot see. `constants.ts` beside the entry is where those go, which is why the file that holds them
 * is exempt here, along with the two that are types or a barrel and the three registries, which are tables by
 * definition.
 */
it('keeps every module to two constants, so a third is a constants.ts', () => {
  const exempt = new Set(['constants.ts', 'types.ts', 'index.ts', 'rings.ts']);
  const registries = new Set(['answers/registry.ts', 'emitters/registry.ts', 'targets/registry.ts']);

  const carrying = sourcesUnder(srcDir).filter((path) => {
    return !path.endsWith('.test.ts')
      && !exempt.has(basename(path))
      && !registries.has(relative(srcDir, path));
  }).filter((path) => {
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);

    return source.statements.filter((statement) => {
      return ts.isVariableStatement(statement) && statement.declarationList.declarations.some((declaration) => {
        const { initializer } = declaration;

        return initializer !== undefined
          && !ts.isArrowFunction(initializer)
          && !ts.isFunctionExpression(initializer);
      });
    }).length > 2;
  }).map((path) => {
    return relative(srcDir, path);
  });

  expect(carrying).toEqual([]);
});

// A Stryker worker reads an instrumented copy of the file, which always carries an `if (`.
const instrumented = process.env['STRYKER_MUTATOR_WORKER'] !== undefined;

// A file is written because its own emitter said so, so the assembler has no condition left to hold.
it.skipIf(instrumented)('leaves the emitter assembler nothing to branch on', () => {
  expect(readFileSync(join(srcDir, 'emitters/registry.ts'), 'utf8')).not.toMatch(/\bif\s*\(/u);
});

describe('answers records', () => {
  const keys = valuesOf(ANSWERS);
  // Widened once: `flag` is optional on the base record, and reading it off the union of the seventeen is not.
  const records: readonly AnswerRecord[] = keys.map((key) => {
    return ANSWERS[key];
  });

  it('carries the registry key on the record itself', () => {
    expect(keys.filter((key) => {
      return ANSWERS[key].key !== key;
    })).toEqual([]);
  });

  it('names each flag once', () => {
    const flags = records.map((record) => {
      return record.flag;
    }).filter((flag): flag is string => {
      return flag !== undefined;
    });

    expect(flags.filter((flag, index) => {
      return flags.indexOf(flag) !== index;
    })).toEqual([]);
  });
});

/**
 * Two tables, one key set. A manager with a floor and no command is one nothing can spawn, and a command with no
 * floor is one nothing can refuse, and either way the one that is missing is found at a spawn rather than here.
 */
it('gives every package manager both a floor and a command', () => {
  const byName = (left: string, right: string): number => {
    return left.localeCompare(right, 'en');
  };
  const commands = Object.keys(MANAGER_BINARIES).toSorted(byName);

  expect(commands).toEqual(Object.keys(MANAGER_FLOORS).toSorted(byName));
  expect(commands).toEqual(valuesOf(ANSWERS.packageManager.values).toSorted(byName));
});
