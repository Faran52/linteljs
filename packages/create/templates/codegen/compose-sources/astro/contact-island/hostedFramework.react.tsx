import { renderToString } from 'react-dom/server';

import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { ContactIsland } from './ContactIsland';

import type { ContactCopy } from './utils/contactCopyUtils';

export const testing = { screen };

export const changeLanguage = (language: string): void => {
  act(() => {
    document.documentElement.lang = language;
  });
};

export const mountIsland = (COPY: ContactCopy): void => {
  render(<ContactIsland copy={COPY} />);
};

export const serverCase = (COPY: ContactCopy, switchTo: (language: string) => void): void => {
  it('renders the build language on the server, whatever the page holds', () => {
    switchTo('ar');

    const html = renderToString(<ContactIsland copy={COPY} />);

    expect(html).toContain('>Send<');
  });
};
