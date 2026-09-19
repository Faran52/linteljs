import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { BUILD_EMITTERS, SEED_EMITTERS } from './registry';

const emittersDir = join(import.meta.dirname);

// `config/` holds the data tables and `utils/` the helpers every emitter shares. Neither writes a file, so neither
// is a group and neither is held to the shape below.
const SHARED = new Set(['config', 'utils']);

const directoriesIn = (path: string): string[] => {
  return readdirSync(path, { withFileTypes: true }).filter((entry) => {
    return entry.isDirectory();
  }).map((entry) => {
    return entry.name;
  });
};

// A group is named for the answer that decides whether its emitters write anything; `always` is the null one.
const groups = directoriesIn(emittersDir).filter((name) => {
  return !SHARED.has(name);
});

// `<group>/<subject>`, the subject being named for the file it writes.
const subjects = groups.flatMap((group) => {
  return directoriesIn(join(emittersDir, group)).filter((name) => {
    return !SHARED.has(name);
  }).map((name) => {
    return {
      group,
      name,
      path: join(emittersDir, group, name),
    };
  });
});

const entriesIn = (path: string): string[] => {
  return readdirSync(path);
};

const modulesIn = (path: string): string[] => {
  return readdirSync(path, {
    withFileTypes: true,
    recursive: true,
  }).filter((entry) => {
    return entry.isFile();
  }).map((entry) => {
    return relative(path, join(entry.parentPath, entry.name));
  });
};

const sourcesUnder = (path: string): string[] => {
  return readdirSync(path, {
    withFileTypes: true,
    recursive: true,
  }).filter((entry) => {
    return entry.isFile() && entry.name.endsWith('.ts');
  }).map((entry) => {
    return join(entry.parentPath, entry.name);
  });
};

const packageSources = sourcesUnder(join(emittersDir, '..'));

// The entry is named for the directory, which is named for the file it writes, so the path is spelled once.
const entryNameOf = (subject: string): string => {
  return `${subject.replace(/-([a-z])/gu, (_match, letter: string) => {
    return letter.toUpperCase();
  })}Emitter`;
};

describe('the registry', () => {
  const registered = new Set([...Object.keys(BUILD_EMITTERS), ...Object.keys(SEED_EMITTERS)]);

  // Read off disk rather than probed, so a directory nobody registered is caught as well as the reverse.
  it('names every subject directory', () => {
    expect(subjects.filter((subject) => {
      return !registered.has(subject.name);
    }).map((subject) => {
      return `${subject.group}/${subject.name}`;
    })).toEqual([]);
  });

  it('names nothing that is not a subject directory', () => {
    const present = new Set(subjects.map((subject) => {
      return subject.name;
    }));

    expect([...registered].filter((key) => {
      return !present.has(key);
    })).toEqual([]);
  });

  // A file is written because its own emitter said so, so the assembler has no condition left to hold.
  it('leaves the assembler nothing to branch on', () => {
    const assembler = readFileSync(join(emittersDir, 'buildArtifacts.ts'), 'utf8');

    expect(assembler).not.toMatch(/\bif\s*\(/u);
  });
});

describe.each(subjects)('$group/$name', ({ name, path }) => {
  const entry = entryNameOf(name);

  it('holds one entry, named for the directory', () => {
    expect(entriesIn(path)).toContain(`${entry}.ts`);
  });

  it('exports that entry under the same name', () => {
    expect(readFileSync(join(path, `${entry}.ts`), 'utf8')).toContain(`export const ${entry} = `);
  });

  // `index` means a barrel in this package, and a subject directory is not one.
  it('holds no index', () => {
    expect(entriesIn(path)).not.toContain('index.ts');
  });

  it('holds nothing but its modules and a utils directory', () => {
    expect(entriesIn(path).filter((file) => {
      return !file.endsWith('.ts') && file !== 'utils';
    })).toEqual([]);
  });

  it('suffixes every private helper and puts it under utils', () => {
    expect(modulesIn(path).filter((file) => {
      return file.includes('/') && !/^utils\/[a-z][A-Za-z]*Utils(\.test)?\.ts$/u.test(file);
    })).toEqual([]);
  });

  /**
   * What makes a helper private is that one subject reads it. A second reader means it belongs to the group or to
   * the ring, and `<group>/utils/` or `emitters/utils/` is where it goes. Checked by reading the import sites,
   * because a helper that quietly gained a second consumer still passes every other assertion here.
   */
  it('keeps every module under its utils private to itself', () => {
    const helpers = modulesIn(path).filter((file) => {
      return file.startsWith('utils/') && !file.endsWith('.test.ts');
    });

    expect(helpers.filter((helper) => {
      const specifier = `${name}/${helper.replace(/\.ts$/u, '')}`;

      return packageSources.some((source) => {
        return !source.startsWith(path) && readFileSync(source, 'utf8').includes(specifier);
      });
    })).toEqual([]);
  });
});
