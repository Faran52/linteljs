// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import Mark from './Mark.astro';

describe('Mark', () => {
  it('draws the named logo', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Mark);

    expect(html).toContain('<svg');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="linteljs"');
  });
});
