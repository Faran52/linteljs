import { ruleIdsFor, startsWith } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import astro from './astro';
import base from './base';

const PAGE = (body: string): string => {
  return `---\nconst title = 'Home';\n---\n\n<h1>{title}</h1>\n${body}\n`;
};

describe('astro', () => {
  it('parses a template and reports an astro rule', async () => {
    const ruleIds = await ruleIdsFor(
      astro(),
      PAGE('<div set:html={title} set:text={title} />'),
      'src/pages/index.astro',
    );

    expect(ruleIds.some(startsWith('astro/'))).toBe(true);
  });

  it('reports an image with no alt text in a template', async () => {
    const ruleIds = await ruleIdsFor(astro(), PAGE('<img src="/a.png" />'), 'src/pages/index.astro');

    expect(ruleIds).toContain('astro/jsx-a11y/alt-text');
  });

  // The plugin leaves its rule entries unglobbed.
  it('says nothing about a TypeScript file', async () => {
    const ruleIds = await ruleIdsFor(astro(), 'export const value = 1;\n', 'src/lib/utils/sample.ts');

    expect(ruleIds.filter(Boolean)).toEqual([]);
  });

  it('stacks under base without either losing its rules', async () => {
    const code = PAGE('<img src="/a.png" />');
    const ruleIds = await ruleIdsFor([...base(), ...astro()], code, 'src/pages/index.astro');

    expect(ruleIds).toContain('astro/jsx-a11y/alt-text');
  });
});
