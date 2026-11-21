import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

export interface Toggle {
  readonly when: string;
  readonly on: string;
  readonly off: string;
}

export type Table = Readonly<Record<string, string | Toggle>>;

// Writes the file only when its text differs, so a step running beside a reader of it never truncates it unchanged.
export const writeChanged = (path: string, text: string): boolean => {
  const previous = existsSync(path) ? readFileSync(path, 'utf8') : undefined;
  const isChanged = text !== previous;

  if (isChanged) {
    writeFileSync(path, text);
  }

  return isChanged;
};
