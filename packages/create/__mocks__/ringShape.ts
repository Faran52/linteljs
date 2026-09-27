import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// What `emitters/meta.test.ts` and `answers/meta.test.ts` both check: a ring's groups sit on disk where its own
// registry says they do, and its barrel carries nothing the rest of the package does not actually import.
export const directoriesIn = (path: string): string[] => {
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => {
      return entry.isDirectory();
    })
    .map((entry) => {
      return entry.name;
    });
};

export const entriesIn = (path: string): string[] => {
  return readdirSync(path);
};

// Every file under the subject, the directory it sits in included, so a helper two levels down is still seen.
export const modulesIn = (path: string): string[] => {
  return readdirSync(path, {
    withFileTypes: true,
    recursive: true,
  })
    .filter((entry) => {
      return entry.isFile();
    })
    .map((entry) => {
      return relative(path, join(entry.parentPath, entry.name));
    });
};

// The entry is named for the directory it sits in, which is why the path is spelled once.
export const entryNameOf = (subject: string, suffix: string): string => {
  return `${subject
    .replace(/-([a-z])/gu, (_match, letter: string) => {
      return letter.toUpperCase();
    })}${suffix}`;
};

export const sourcesUnder = (path: string): string[] => {
  return readdirSync(path, {
    withFileTypes: true,
    recursive: true,
  })
    .filter((entry) => {
      return entry.isFile() && entry.name.endsWith('.ts');
    })
    .map((entry) => {
      return join(entry.parentPath, entry.name);
    });
};

/**
 * What everything outside `ringDir` actually takes from its barrel, rather than what it mentions: a name reached
 * for by its own path is not a reason to carry it there. `ringName` is the barrel's own import specifier, read off
 * a relative path of any depth (`./terminal`, `../emitters`, `../../src/terminal`, ...). A re-export counts
 * as a take: `src/index.ts` carrying `main` onward is the package surface asking for it.
 *
 * Scanned from the package rather than from `src/`, because the barrel's readers are not all rings: `__mocks__/`
 * takes the prompter through `terminal/`, and a barrel trimmed on `src/` alone would drop it.
 */
export const takenFromBarrel = (ringDir: string, ringName: string): Set<string> => {
  const taken = new Set<string>();
  const pattern = new RegExp(
    `(?:import|export) (?:type )?\\{([^}]*)\\} from '(?:(?:\\.{1,2}/)+(?:src/)?${ringName}|@${ringName})';`,
    'gu',
  );

  for (const source of sourcesUnder(join(ringDir, '../..'))) {
    if (source.startsWith(ringDir)) {
      continue;
    }

    const text = readFileSync(source, 'utf8');

    for (const [, names] of text.matchAll(pattern)) {
      for (const name of (names ?? '').split(',')) {
        const bare = name
          .replace('type ', '')
          .trim();

        taken.add(bare);
      }
    }
  }

  return taken;
};
