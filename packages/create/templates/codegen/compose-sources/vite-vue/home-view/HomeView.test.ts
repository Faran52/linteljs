import { NAME } from '@config/linteljs';

import { mountHome, storeCases } from './store';

describe('HomeView', () => {
  it('carries the project name as its heading', () => {
    const title = mountHome()
      .find('h1')
      .text();

    expect(title).toBe(NAME);
  });

  storeCases();
});
