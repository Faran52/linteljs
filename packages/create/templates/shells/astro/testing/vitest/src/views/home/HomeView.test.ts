// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import { CHECK, NAME } from '@config/linteljs';

import HomeView from './HomeView.astro';

describe('HomeView', () => {
  it('names the project and the command that gates it', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(HomeView);

    expect(html).toContain(NAME);
    expect(html).toContain(CHECK);
  });
});
