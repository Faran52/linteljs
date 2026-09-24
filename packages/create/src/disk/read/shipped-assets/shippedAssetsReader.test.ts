import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { shippedAssetsReader, TEMPLATES_ROOT } from './shippedAssetsReader';

const SKILL = 'project/plugins/linteljs/skills/linteljs/SKILL.md';

describe('TEMPLATES_ROOT', () => {
  it('points at the assets directory the shipped files actually live in', async () => {
    const skill = await readFile(join(TEMPLATES_ROOT, SKILL), 'utf8');

    expect(skill).toContain('name: linteljs');
  });
});

describe('shippedAssetsReader', () => {
  it('returns emitted text unchanged', async () => {
    expect(await shippedAssetsReader({ text: 'export default {};' })).toBe('export default {};');
  });

  // A merge composes against what is on disk, so the current text is its whole input.
  it('hands a merge the current text and returns what it composes', async () => {
    expect(await shippedAssetsReader({
      merge: (current) => {
        return `${current ?? 'nothing'} merged`;
      },
    }, 'on disk')).toBe('on disk merged');
  });

  it('reads and joins copied sources in the order they are listed', async () => {
    const joined = await shippedAssetsReader({
      sources: [
        'fragments/claude-rules/testing.react.md',
        'fragments/claude-rules/testing.standard.md',
      ],
    });
    const [head, standard] = await Promise.all([
      readFile(join(TEMPLATES_ROOT, 'fragments/claude-rules/testing.react.md'), 'utf8'),
      readFile(join(TEMPLATES_ROOT, 'fragments/claude-rules/testing.standard.md'), 'utf8'),
    ]);

    expect(joined).toBe(`${head}\n${standard}`);
  });

  it('applies the transform to the joined text when one is given', async () => {
    const original = await readFile(join(TEMPLATES_ROOT, SKILL), 'utf8');

    const transformed = await shippedAssetsReader({
      sources: [SKILL],
      transform: (source) => {
        return source.toUpperCase();
      },
    });

    expect(transformed).toBe(original.toUpperCase());
  });

  it('returns the joined text as-is when no transform is given', async () => {
    const original = await readFile(join(TEMPLATES_ROOT, SKILL), 'utf8');

    expect(await shippedAssetsReader({ sources: [SKILL] })).toBe(original);
  });
});
