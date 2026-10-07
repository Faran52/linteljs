import { mount } from '@vue/test-utils';

import { NAME } from '@config/linteljs';

import App from './app.vue';

const global = { stubs: { AppHeader: true, NuxtPage: true } };

describe('the app shell', () => {
  it('renders the route under a header that carries the project name', () => {
    const shell = mount(App, { global });

    const name = shell
      .findComponent({ name: 'AppHeader' })
      .props('name');
    expect(name).toBe(NAME);

    const html = shell.html();
    expect(html).toMatch(/<app-header-stub[^>]*><\/app-header-stub>\s*<nuxt-page-stub/v);
  });
});
