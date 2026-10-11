import {
  createSSRApp,
  h,
  nextTick,
} from 'vue';
import { mount } from '@vue/test-utils';

import { renderToString } from 'vue/server-renderer';

import ContactIsland from './ContactIsland.vue';

const COPY = {
  en: { contactSend: 'Send' },
  ar: { contactSend: 'أرسل' },
};

const sendOf = (island: ReturnType<typeof mount>): string => {
  return island
    .get('button')
    .text();
};

describe('ContactIsland', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
    vi.restoreAllMocks();
  });

  it('renders the language on the page once mounted', async () => {
    document.documentElement.lang = 'ar';

    const island = mount(ContactIsland, { props: { copy: COPY } });

    await nextTick();

    const send = sendOf(island);

    expect(send).toBe('أرسل');
  });

  it('renders the build language on the server, whatever the page holds', async () => {
    document.documentElement.lang = 'ar';

    const app = createSSRApp({
      render: () => {
        return h(ContactIsland, { copy: COPY });
      },
    });
    const html = await renderToString(app);

    expect(html).toContain('>Send<');
  });

  it('renders again when the switcher changes the language', async () => {
    const island = mount(ContactIsland, { props: { copy: COPY } });

    document.documentElement.lang = 'ar';

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    const send = sendOf(island);

    expect(send).toBe('أرسل');
  });

  it('stops following the page once unmounted', () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const island = mount(ContactIsland, { props: { copy: COPY } });

    island.unmount();

    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('shows the key a language has no word for', async () => {
    document.documentElement.lang = 'ja';

    const island = mount(ContactIsland, { props: { copy: COPY } });

    await nextTick();

    const send = sendOf(island);

    expect(send).toBe('contactSend');
  });
});
