import { Platform } from 'react-native';

import Head from 'expo-router/head';

import { NAME } from '@config/linteljs';

import type { ReactNode } from 'react';

// The document the static export writes, with the Mark as its icon. On a native build ExpoHead
// wants a handoff origin, and throws in development without one.
export const DocumentHead = (): ReactNode => {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <Head>
      <title>{NAME}</title>
      <link
        href="/favicon.svg"
        rel="icon"
        type="image/svg+xml"
      />
    </Head>
  );
};
