import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

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

export const modulesIn = (path: string): string[] => {
  return readdirSync(path, {
    withFileTypes: true,
    recursive: true,
  })
    .filter((entry) => {
      return entry.isFile();
    })
    .map((entry) => {
      const file = join(entry.parentPath, entry.name);

      return relative(path, file);
    });
};

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

export const takenFromBarrel = (ringDir: string, ringName: string): Set<string> => {
  const taken = new Set<string>();
  const pattern = new RegExp(
    `(?:import|export) (?:type )?\\{([^}]*)\\} from '(?:(?:\\.{1,2}/)+(?:src/)?${ringName}|@${ringName})';`,
    'gu',
  );

  const packageDir = join(ringDir, '../..');

  for (const source of sourcesUnder(packageDir)) {
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
