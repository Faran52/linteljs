// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import ContactView from './ContactView.astro';

// A server render would compile the island a second time, and its coverage with it; the island has its own suite.
vi.mock('@views/contact/ContactIsland', () => {
  const island = { ContactIsland: vi.fn() };

  return island;
});

describe('ContactView', () => {
  it('hydrates the contact island on load', async () => {
    const container = await AstroContainer.create();

    container.addServerRenderer({
      name: 'island',
      renderer: {
        name: 'island',
        check: () => {
          return Promise.resolve(true);
        },
        renderToStaticMarkup: () => {
          const markup = { html: '' };

          return Promise.resolve(markup);
        },
      },
    });

    container.addClientRenderer({ name: 'island', entrypoint: 'island' });

    const html = await container.renderToString(ContactView);

    expect(html).toContain('client="load"');
  });
});
