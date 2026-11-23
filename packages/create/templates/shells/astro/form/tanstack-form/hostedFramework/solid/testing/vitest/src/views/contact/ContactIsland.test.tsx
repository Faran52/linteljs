import { render, screen } from '@solidjs/testing-library';

import { ContactIsland } from './ContactIsland';

const COPY = {
  en: { contactSend: 'Send' },
  ar: { contactSend: 'أرسل' },
};

const switchTo = (language: string): void => {
  document.documentElement.lang = language;
};

const renderIsland = (): void => {
  render(() => {
    return <ContactIsland copy={COPY} />;
  });
};

describe('ContactIsland', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  it('renders the language on the page once mounted', () => {
    switchTo('ar');
    renderIsland();

    const button = screen.getByRole('button', { name: 'أرسل' });

    expect(button).toBeTruthy();
  });

  it('renders again when the switcher changes the language', async () => {
    renderIsland();
    switchTo('ar');

    const button = await screen.findByRole('button', { name: 'أرسل' });

    expect(button).toBeTruthy();
  });

  it('shows the key a language has no word for', () => {
    switchTo('ja');
    renderIsland();

    const button = screen.getByRole('button', { name: 'contactSend' });

    expect(button).toBeTruthy();
  });
});
