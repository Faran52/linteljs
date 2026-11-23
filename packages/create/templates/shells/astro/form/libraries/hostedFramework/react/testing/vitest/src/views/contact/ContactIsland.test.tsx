import { renderToString } from 'react-dom/server';

import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { ContactIsland } from './ContactIsland';

const COPY = {
  en: { contactSend: 'Send' },
  ar: { contactSend: 'أرسل' },
};

const switchTo = (language: string): void => {
  act(() => {
    document.documentElement.lang = language;
  });
};

const renderIsland = (): void => {
  render(<ContactIsland copy={COPY} />);
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

  it('renders the build language on the server, whatever the page holds', () => {
    switchTo('ar');

    const html = renderToString(<ContactIsland copy={COPY} />);

    expect(html).toContain('>Send<');
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
