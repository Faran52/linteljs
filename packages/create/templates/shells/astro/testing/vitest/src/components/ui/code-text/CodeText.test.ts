// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import CodeText from './CodeText.astro';

describe('CodeText', () => {
  it('wraps each marked part in code and keeps the rest as text', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CodeText, { props: { text: 'Run <code>pnpm check</code> now' } });
    // Dev builds add source attributes to the tag.
    const wrapped = /^Run <code[^>]*>pnpm check<\/code> now$/u;

    expect(html).toMatch(wrapped);
  });

  it('renders plain text untouched', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CodeText, { props: { text: 'No code here' } });

    expect(html).toBe('No code here');
  });

  it('leaves the code uncoloured without a tone', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CodeText, { props: { text: '<code>pnpm check</code>' } });

    expect(html).not.toMatch(/class=/u);
  });
});
