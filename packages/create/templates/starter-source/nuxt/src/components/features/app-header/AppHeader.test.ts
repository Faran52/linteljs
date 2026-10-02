import { createMemoryHistory, createRouter } from 'vue-router';
import { mount } from '@vue/test-utils';

import { PAGES } from '@config/routes';

import AppHeader from './AppHeader.vue';
import { styles } from './styles';

const open = async (path: string): Promise<ReturnType<typeof mount>> => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: PAGES
      .map((page) => {
        return {
          path: page.path,
          component: { template: '<div />' },
        };
      }),
  });

  await router.push(path);
  await router.isReady();

  return mount(AppHeader, {
    props: { name: 'my-app' },
    global: {
      plugins: [router],
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
