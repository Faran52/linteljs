import { createMemoryHistory, createRouter } from 'vue-router';
import { mount } from '@vue/test-utils';

import { ROUTES } from '@router/constants';

import AppHeader from './AppHeader.vue';
import { styles } from './appHeaderStyles';

const open = async (path: string): Promise<ReturnType<typeof mount>> => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ROUTES
      .map((entry) => {
        const route = {
          path: entry.path,
          component: { template: '<div />' },
        };

        return route;
      }),
  });

  await router.push(path);
  await router.isReady();

  return mount(AppHeader, {
    props: { name: 'my-app' },
    global: { plugins: [router] },
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
    expect(found).toHaveLength(ROUTES.length);
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
    // RouterLink adds its own active classes ahead of the ones bound.
    const classes = marked[0]?.attributes('class');
    const tab = styles.tab(true).class;
    expect(classes).toContain(tab);
  });
});
