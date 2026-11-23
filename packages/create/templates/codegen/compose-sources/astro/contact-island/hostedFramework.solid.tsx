import { render, screen } from '@solidjs/testing-library';

import { ContactIsland } from './ContactIsland';

import type { ContactCopy } from './utils/contactCopyUtils';

export const testing = { screen };

export const changeLanguage = (language: string): void => {
  document.documentElement.lang = language;
};

export const mountIsland = (COPY: ContactCopy): void => {
  render(() => {
    return <ContactIsland copy={COPY} />;
  });
};

export const serverCase = (COPY: ContactCopy, switchTo: (language: string) => void): void => {};
