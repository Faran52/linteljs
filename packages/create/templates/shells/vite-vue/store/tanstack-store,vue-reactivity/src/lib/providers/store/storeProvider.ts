import type { App } from 'vue';

export type StoreProvider = (app: App) => void;

// A function, because Vue installs a store as a plugin on the app.
export const storeProvider: StoreProvider = () => {
  // Nothing to install.
};
