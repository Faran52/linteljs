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

// Answers whether the write changed the file.
export const writeChanged = (path: string, text: string): boolean => {
  const previous = existsSync(path) ? readFileSync(path, 'utf8') : undefined;

  writeFileSync(path, text);

  return text !== previous;
};
