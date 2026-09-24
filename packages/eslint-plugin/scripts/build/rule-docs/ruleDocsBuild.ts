// Flattens `src/rules/<id>/README.md` into `docs/rules/<id>.md` for the tarball. Every version since 1.0.0 packed
// `docs/`, and `files` does not pack `src`, so the published path is generated from the doc beside its rule.
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

import { log } from '../../../../../scripts/utils/loggerUtils.ts';

const root = resolve(import.meta.dirname, '../../..');
const rulesDir = join(root, 'src', 'rules');
const docsDir = join(root, 'docs', 'rules');

rmSync(docsDir, {
  recursive: true,
  force: true,
});
mkdirSync(docsDir, { recursive: true });

const ruleIds = readdirSync(rulesDir, { withFileTypes: true })
  .filter((entry) => {
    return entry.isDirectory();
  })
  .map((entry) => {
    return entry.name;
  });

// A sibling link `](../other-rule)` would 404 once flattened, so it becomes the file. Any other relative link
// points out of `src/`, meaningless in the tarball and worth failing on.
const relink = (text: string, id: string): string => {
  return text.replace(/]\(\.\.\/([a-z-]+)\)/g, (match: string, target: string) => {
    if (!ruleIds.includes(target)) {
      throw new Error(`${id}/README.md links ../${target}, which is not a rule`);
    }

    return `](./${target}.md)`;
  });
};

for (const id of ruleIds) {
  const source = readFileSync(join(rulesDir, id, 'README.md'), 'utf8');

  writeFileSync(join(docsDir, `${id}.md`), relink(source, id));
}

log(`wrote ${String(ruleIds.length)} rule docs to docs/rules`);
