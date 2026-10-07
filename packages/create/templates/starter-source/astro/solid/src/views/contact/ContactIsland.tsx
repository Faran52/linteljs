import { DataProvider } from '@lib/providers/data/DataProvider';

import { ContactPage } from './ContactPage';

import type { JSX } from 'solid-js';

// An island is its own Solid root, so it brings its provider.
export const ContactIsland = (): JSX.Element => {
  return (
    <DataProvider>
      <ContactPage />
    </DataProvider>
  );
};
