import { createMemoryHistory, createRouter } from 'vue-router';
import { mount } from '@vue/test-utils';

import { PAGES } from '../../../config/routes';

import AppHeader from './AppHeader.vue';

/*
 * A real vue-router, because `useRoute` is what marks the tab you are on, with `NuxtLink` stubbed: it is Nuxt's
 * own component and only its build provides it, and what this suite is about is the list, not the prefetch.
 */
const open = async (path: string): Promise<ReturnType<typeof mount>> => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: PAGES.map((page) => {
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

/*
 * Found by role and by the nav around them rather than by class: under StyleX a class is a compiled atomic
 * name, so a suite that spelled one would be testing the styling answer instead of the markup.
 */
describe('AppHeader', () => {
  it('names the project and links every page on the one route list', async () => {
    const header = await open('/');

    expect(header.find('header p').text()).toBe('my-app');
    expect(header.findAll('nav a')).toHaveLength(PAGES.length);
  });

  it('marks the page it is on', async () => {
    const header = await open('/about');
    const marked = header.findAll('nav a').filter((tab) => {
      return tab.attributes('aria-current') === 'page';
    });

    expect(marked).toHaveLength(1);
    expect(marked[0]?.text()).toBe('About');
  });
});
