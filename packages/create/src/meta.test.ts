import { readFileSync } from 'node:fs';
import {
  basename,
  join,
  relative,
} from 'node:path';

import { byName } from '@mocks/byName';
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

import { MANAGER_FLOORS } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import { type AnswerRecord, ANSWERS } from '@answers';
import { BUILD_EMITTERS, SEED_EMITTERS } from '@emitters/registry';
import { TARGETS } from '@targets';

import { type Ring, RINGS } from './rings';

interface RingShape {
  name: Ring;
  suffixes: Record<string, string>;
  registry?: () => string[];
  files?: true;
}

interface Subject {
  ring: string;
  group: string;
  name: string;
  path: string;
  entry: string;
  registered: boolean;
}

const srcDir = join(import.meta.dirname);

const SHARED = new Set(['utils']);

const kebab = (key: string): string => {
  return key
    .replace(/([a-z])([A-Z])/gu, '$1-$2')
    .toLowerCase();
};

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
      return Object.keys(ANSWERS)
        .map(kebab);
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
      const emitterKeys = [...Object.keys(BUILD_EMITTERS), ...Object.keys(SEED_EMITTERS)];
      return emitterKeys;
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

  return Object.entries(ring.suffixes)
    .flatMap(([group, suffix]) => {
      const groupDir = join(ringDir, group);

      return directoriesIn(groupDir)
        .filter((name) => {
          return !SHARED.has(name) && !(group === '' && name in ring.suffixes);
        })
        .map((name) => {
          const subject: Subject = {
            ring: ring.name,
            group,
            name,
            path: join(groupDir, name),
            entry: entryNameOf(name, suffix),
            registered: ring.registry !== undefined,
          };
          return subject;
        });
    });
};

const keyOf = (subject: Subject, registered: string[]): string => {
  return registered
    .some((key) => {
      return key.includes('/');
    })
    ? `${subject.group}/${subject.name}`
    : subject.name;
};

const RINGED = SHAPES
  .filter((ring) => {
    return ring.files === undefined;
  });

const packageSources = sourcesUnder(srcDir);

it('holds the same rings as rings.ts', () => {
  const shapeNames = SHAPES
    .map((ring) => {
      return ring.name;
    });

  const sortedRings = [...RINGS]
    .toSorted((left, right) => {
      return left.localeCompare(right, 'en');
    });

  expect(shapeNames).toEqual(sortedRings);
});

const fileRings = SHAPES
  .filter((ring) => {
    return ring.files === true;
  });

describe.each(fileRings)('$name', (ring) => {
  it('holds no subject', () => {
    const directories = directoriesIn(join(srcDir, ring.name));
    expect(directories).toEqual([]);
  });
});

describe.each(RINGED)('$name', (ring) => {
  const ringDir = join(srcDir, ring.name);

  it('holds a subject somewhere, so the assertions below are not vacuous', () => {
    expect(subjectsIn(ring).length).toBeGreaterThan(0);
  });

  it('exports nothing the rings outside it never take from it', () => {
    const barrel = readFileSync(join(ringDir, 'index.ts'), 'utf8');
    const exported = [...barrel.matchAll(/export (?:type )?\{([^}]*)\} from/gu)]
      .flatMap(([, names]) => {
        return (names ?? '').split(',');
      })
      .map((name) => {
        return name
          .replace('type ', '')
          .trim();
      })
      .filter((name) => {
        return name !== '';
      });

    expect(exported.length).toBeGreaterThan(0);

    const taken = takenFromBarrel(ringDir, ring.name);

    const untaken = exported
      .filter((name) => {
        return !taken.has(name);
      });

    expect(untaken).toEqual([]);
  });
});

const registeredRings = RINGED
  .filter((ring) => {
    return ring.registry !== undefined;
  });

describe.each(registeredRings)('$name registry', (ring) => {
  const registered = ring.registry?.() ?? [];
  const keys = subjectsIn(ring)
    .map((subject) => {
      return keyOf(subject, registered);
    });

  it('names every subject directory', () => {
    const unregistered = keys
      .filter((key) => {
        return !registered.includes(key);
      });

    expect(unregistered).toEqual([]);
  });

  it('names nothing that is not a subject directory', () => {
    const orphaned = registered
      .filter((key) => {
        return !keys.includes(key);
      });

    expect(orphaned).toEqual([]);
  });

  it('holds exactly one subject per key', () => {
    const duplicates = keys
      .filter((key, index) => {
        return keys.indexOf(key) !== index;
      });

    expect(duplicates).toEqual([]);
  });
});

const SUBJECTS = RINGED.flatMap(subjectsIn);

describe.each(SUBJECTS)('$ring/$name', ({ path, entry }) => {
  it('holds one entry, named for the directory', () => {
    const entries = entriesIn(path);
    expect(entries).toContain(`${entry}.ts`);
  });

  it('holds no index', () => {
    const entries = entriesIn(path);
    expect(entries).not.toContain('index.ts');
  });

  it('holds nothing but its entry, its constants and a utils directory', () => {
    const allowed = new RegExp(`^(${entry}\\.test\\.ts|${entry}\\.ts|constants\\.ts)$`, 'u');

    const strays = entriesIn(path)
      .filter((file) => {
        return file !== 'utils' && !allowed.test(file);
      });

    expect(strays).toEqual([]);
  });

  it('suffixes every private helper and puts it under utils', () => {
    const misplaced = modulesIn(path)
      .filter((file) => {
        return file.includes('/') && !/^utils\/[a-z][A-Za-z]*Utils(\.test)?\.ts$/u.test(file);
      });

    expect(misplaced).toEqual([]);
  });

  it('keeps every module under its utils private to itself', () => {
    const helpers = modulesIn(path)
      .filter((file) => {
        return file.startsWith('utils/') && !file.endsWith('.test.ts');
      });

    const leaked = helpers
      .filter((helper) => {
        const specifier = `${relative(srcDir, path)}/${helper.replace(/\.ts$/u, '')}`;

        return packageSources
          .some((source) => {
            return !source.startsWith(path) && readFileSync(source, 'utf8').includes(specifier);
          });
      });

    expect(leaked).toEqual([]);
  });
});

const registeredSubjects = RINGED
  .flatMap(subjectsIn)
  .filter((subject) => {
    return subject.registered;
  });

describe.each(registeredSubjects)('$ring/$name', ({ path, entry }) => {
  it('exports that entry under the same name', () => {
    const file = readFileSync(join(path, `${entry}.ts`), 'utf8');
    expect(file).toMatch(new RegExp(`export const ${entry}[ :]`, 'u'));
  });
});

it('keeps every module to two constants, so a third is a constants.ts', () => {
  const exempt = new Set([
    'constants.ts',
    'types.ts',
    'index.ts',
    'rings.ts',
  ]);
  const registries = new Set([
    'answers/registry.ts',
    'emitters/registry.ts',
    'targets/registry.ts',
  ]);

  const carrying = sourcesUnder(srcDir)
    .filter((path) => {
      const fileName = basename(path);
      const fromSrc = relative(srcDir, path);
      return !path.endsWith('.test.ts')
        && !exempt.has(fileName)
        && !registries.has(fromSrc);
    })
    .filter((path) => {
      const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);

      return source.statements
        .filter((statement) => {
          return ts.isVariableStatement(statement) && statement.declarationList.declarations
            .some((declaration) => {
              const { initializer } = declaration;

              return initializer !== undefined
                && !ts.isArrowFunction(initializer)
                && !ts.isFunctionExpression(initializer);
            });
        }).length > 2;
    })
    .map((path) => {
      return relative(srcDir, path);
    });

  expect(carrying).toEqual([]);
});

const instrumented = process.env['STRYKER_MUTATOR_WORKER'] !== undefined;

it.skipIf(instrumented)('leaves the emitter assembler nothing to branch on', () => {
  const file = readFileSync(join(srcDir, 'emitters/registry.ts'), 'utf8');
  expect(file).not.toMatch(/\bif\s*\(/u);
});

describe('answers records', () => {
  const keys = valuesOf(ANSWERS);
  const records: readonly AnswerRecord[] = keys
    .map((key) => {
      return ANSWERS[key];
    });

  it('carries the registry key on the record itself', () => {
    const misfiled = keys
      .filter((key) => {
        return ANSWERS[key].key !== key;
      });

    expect(misfiled).toEqual([]);
  });

  it('names each flag once', () => {
    const flags = records
      .map((record) => {
        return record.flag;
      })
      .filter((flag): flag is string => {
        return flag !== undefined;
      });

    const duplicates = flags
      .filter((flag, index) => {
        return flags.indexOf(flag) !== index;
      });

    expect(duplicates).toEqual([]);
  });
});

it('gives every package manager a floor', () => {
  const floored = Object.keys(MANAGER_FLOORS)
    .toSorted(byName);

  const managers = valuesOf(ANSWERS.packageManager.values)
    .toSorted(byName);

  expect(floored).toEqual(managers);
});
