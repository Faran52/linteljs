import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export const rulesDir = join(import.meta.dirname, '..', 'src', 'rules');

// Read off disk, so a directory nothing registers is still seen.
export const ruleDirectories = readdirSync(rulesDir, { withFileTypes: true })
  .filter((entry) => {
    return entry.isDirectory();
  })
  .map((entry) => {
    return entry.name;
  });

export const moduleNameOf = (ruleName: string): string => {
  return ruleName
    .replace(/-([a-z])/g, (_match, letter: string) => {
      return letter.toUpperCase();
    });
};
