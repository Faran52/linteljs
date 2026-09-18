import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { ASSETS_ROOT, contentOf } from './shippedAssets';

const SKILL = 'linteljs-plugin/skills/linteljs/SKILL.md';

describe('ASSETS_ROOT', () => {
  it('points at the assets directory the shipped files actually live in', async () => {
    const skill = await readFile(join(ASSETS_ROOT, SKILL), 'utf8');

    expect(skill).toContain('name: linteljs');
  });
});

describe('contentOf', () => {
  it('returns emitted text unchanged', async () => {
    expect(await contentOf({ text: 'export default {};' })).toBe('export default {};');
  });

  it('reads and joins copied sources in the order they are listed', async () => {
    const joined = await contentOf({
      sources: ['claude-rules/testing.react.md', 'claude-rules/testing.standard.md'],
    });
    const [head, standard] = await Promise.all([
      readFile(join(ASSETS_ROOT, 'claude-rules/testing.react.md'), 'utf8'),
      readFile(join(ASSETS_ROOT, 'claude-rules/testing.standard.md'), 'utf8'),
    ]);

    expect(joined).toBe(`${head}\n${standard}`);
  });

  it('applies the transform to the joined text when one is given', async () => {
    const original = await readFile(join(ASSETS_ROOT, SKILL), 'utf8');

    const transformed = await contentOf({
      sources: [SKILL],
      transform: (source) => {
        return source.toUpperCase();
      },
    });

    expect(transformed).toBe(original.toUpperCase());
  });

  it('returns the joined text as-is when no transform is given', async () => {
    const original = await readFile(join(ASSETS_ROOT, SKILL), 'utf8');

    expect(await contentOf({ sources: [SKILL] })).toBe(original);
  });
});
