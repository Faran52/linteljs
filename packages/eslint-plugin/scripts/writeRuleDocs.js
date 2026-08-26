/**
 * Flattens `src/rules/<id>/README.md` into `docs/rules/<id>.md` for the tarball. Every version through 1.0.3 packed
 * `docs/`, so a consumer reading rule docs out of `node_modules/@linteljs/eslint-plugin/docs/rules/import-newlines.md`
 * has been able to since 1.0.0. The move to a workspace put the same text at `src/rules/import-newlines/README.md`,
 * where a rule's documentation belongs beside its implementation, and `files` does not pack `src`, so publishing
 * that as-is would silently drop eleven files a published path points at. The source of truth stays beside the
 * rule and the published path is generated from it.
 */
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
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

/**
 * A rule README links a sibling as `](../other-rule)`, a directory GitHub renders by its README. Flattened, that
 * text resolves to `docs/other-rule` and 404s, so the link is rewritten to the file it becomes. Only siblings are
 * rewritten; any other relative link points out of `src/`, meaningless in the tarball and worth failing on.
 */
const relink = (text, id) => {
  return text.replace(/]\(\.\.\/([a-z-]+)\)/g, (match, target) => {
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

console.log(`✓ wrote ${String(ruleIds.length)} rule docs to docs/rules`);
