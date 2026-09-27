import type { App } from 'vue';

export type InstallStore = (app: App) => void;

// A function, because Vue installs a store as a plugin on the app.
export const installStore: InstallStore = () => {
  // Nothing to install.
};
