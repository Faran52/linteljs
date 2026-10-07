// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import { GATE } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import AboutView from './AboutView.astro';

describe('AboutView', () => {
  it('lists every leg of the gate', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(AboutView);

    for (const { command } of GATE) {
      expect(html).toContain(command);
    }
  });

  it('names where the standard lives, so nothing has to be hunted for', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(AboutView);

    for (const { path } of STANDARD_PATHS) {
      expect(html).toContain(path);
    }
  });
});
