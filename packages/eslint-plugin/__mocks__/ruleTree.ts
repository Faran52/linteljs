import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export const rulesDir = join(import.meta.dirname, '..', 'src', 'rules');

// Read off disk rather than from the registry, so a directory nothing registers is still seen, and so a suite can list
// the rules without importing one.
export const ruleDirectories = readdirSync(rulesDir, { withFileTypes: true })
  .filter((entry) => {
    return entry.isDirectory();
  })
  .map((entry) => {
    return entry.name;
  });

// The rule's file is named for its single export, so the directory is the one place the kebab-case id is written.
export const moduleNameOf = (ruleName: string): string => {
  return ruleName
    .replace(/-([a-z])/g, (_match, letter: string) => {
      return letter.toUpperCase();
    });
};
