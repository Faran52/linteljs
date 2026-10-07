import { render, screen } from '@testing-library/svelte';

import ContactIsland from './ContactIsland.svelte';

const COPY = {
  en: { contactSend: 'Send' },
  ar: { contactSend: 'أرسل' },
};

const renderIsland = (): ReturnType<typeof render> => {
  return render(ContactIsland, { copy: COPY });
};

describe('ContactIsland', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
    vi.restoreAllMocks();
  });

  it('renders the language on the page once mounted', async () => {
    document.documentElement.lang = 'ar';
    renderIsland();

    const button = await screen.findByRole('button', { name: 'أرسل' });

    expect(button).toBeTruthy();
  });

  it('renders again when the switcher changes the language', async () => {
    renderIsland();
    await screen.findByRole('button', { name: 'Send' });
    document.documentElement.lang = 'ar';

    const button = await screen.findByRole('button', { name: 'أرسل' });

    expect(button).toBeTruthy();
  });

  it('stops following the page once unmounted', () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const { unmount } = renderIsland();

    unmount();

    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('shows the key a language has no word for', async () => {
    document.documentElement.lang = 'ja';
    renderIsland();

    const button = await screen.findByRole('button', { name: 'contactSend' });

    expect(button).toBeTruthy();
  });
});
