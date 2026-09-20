import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import App from './App.vue';
import router from './router';

describe('App', () => {
  it('renders both routes', async () => {
    const wrapper = mount(App, { global: { plugins: [router] } });

    await router.push('/');
    await router.isReady();
    await nextTick();

    expect(wrapper.text()).toContain('You did it!');

    await router.push('/about');
    await nextTick();

    expect(wrapper.text()).toContain('This is an about page');
  });

  it('asks the dev server to open the readme', async () => {
    const openInEditor = vi.fn();

    vi.stubGlobal('fetch', openInEditor);

    const wrapper = mount(App, { global: { plugins: [router] } });

    await router.push('/');
    await router.isReady();
    await nextTick();

    await wrapper.get('a[href="javascript:void(0)"]').trigger('click');

    expect(openInEditor).toHaveBeenCalledWith('/__open-in-editor?file=README.md');

    vi.unstubAllGlobals();
  });
});
