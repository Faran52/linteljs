import {
  enabledRuleIdsFor,
  ruleIdsFor,
  startsWith,
} from '@mocks/lintText';
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

  // The plugin leaves its rule entries unglobbed and this layer scopes them, so what is worth asserting is the
  // enabled set under `base()`. `astro()` alone matches no TypeScript file at all, so linting one answers a single
  // null-id "no matching configuration" notice and an assertion over the reported ids holds whatever the layer does.
  it('enables no astro rule on a TypeScript file', async () => {
    const enabled = await enabledRuleIdsFor([...base(), ...astro()], 'src/lib/utils/sample.ts');

    expect(enabled.filter(startsWith('astro/'))).toEqual([]);
  });

  it('stacks under base without either losing its rules', async () => {
    const code = PAGE('<img src="/a.png" />');
    const ruleIds = await ruleIdsFor([...base(), ...astro()], code, 'src/pages/index.astro');

    expect(ruleIds).toContain('astro/jsx-a11y/alt-text');
  });
});
