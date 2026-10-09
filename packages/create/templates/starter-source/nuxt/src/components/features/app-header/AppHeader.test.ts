import { mount } from '@vue/test-utils';
import { useRouter } from 'nuxt/app';

import { PAGES } from '@config/routes';

import { styles } from './AppHeader.styles';
import AppHeader from './AppHeader.vue';

const open = async (path: string): Promise<ReturnType<typeof mount>> => {
  // The header reads Nuxt's own route, so the booted app navigates.
  await useRouter().push(path);

  return mount(AppHeader, {
    props: { name: 'my-app' },
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });
};

describe('AppHeader', () => {
  it('names the project and links every page on the one route list', async () => {
    const header = await open('/');

    const [label, name] = header
      .findAll('p')
      .map((paragraph) => {
        return paragraph.text();
      });

    expect(label).toBe('LintelJS Starter');
    expect(name).toBe('my-app');
    const found = header.findAll('nav a');
    expect(found).toHaveLength(PAGES.length);
  });

  it('marks the page it is on', async () => {
    const header = await open('/about');
    const marked = header
      .findAll('nav a')
      .filter((tab) => {
        return tab.attributes('aria-current') === 'page';
      });

    expect(marked).toHaveLength(1);
    const actual = marked[0]?.text();
    expect(actual).toBe('About');
    const actual2 = marked[0]?.attributes('class');
    expect(actual2).toBe(styles.tab(true).class);
  });
});
