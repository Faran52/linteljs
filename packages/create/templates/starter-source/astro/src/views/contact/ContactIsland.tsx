import { DataProvider } from '@lib/providers/data/DataProvider';

import { ContactPage } from './ContactPage';

import type { FC } from 'react';

// An island is its own React root, so it brings its provider.
export const ContactIsland: FC = () => {
  return (
    <DataProvider>
      <ContactPage />
    </DataProvider>
  );
};
