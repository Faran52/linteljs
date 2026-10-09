// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import { PAGES } from '@config/routes';

import AppHeader from './AppHeader.astro';

const render = async (path: string): Promise<string> => {
  const container = await AstroContainer.create();

  return container.renderToString(AppHeader, {
    props: { name: 'demo-app' },
    request: new Request(`http://localhost${path}`),
  });
};

describe('AppHeader', () => {
  it('names the project and links every page', async () => {
    const html = await render('/');

    expect(html).toContain('demo-app');

    for (const page of PAGES) {
      expect(html).toContain(`href="${page.path}"`);
      expect(html).toContain(page.label);
    }
  });

  it('marks only the current page', async () => {
    const html = await render('/about');
    const current = html.match(/aria-current="page"/gu) ?? [];
    const aboutLink = /<a[^>]*href="\/about"[^>]*aria-current="page"/u;

    expect(current).toHaveLength(1);
    expect(html).toMatch(aboutLink);
  });
});
