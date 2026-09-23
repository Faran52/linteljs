import type { App } from 'vue';

export type InstallStore = (app: App) => void;

/*
 * The slot a store fills. With none there is nothing to install, so this does nothing and a project that adds one
 * replaces this file alone.
 *
 * A function rather than a component, because Vue installs a store as a plugin on the app. It is here rather than
 * inside the entry so that the entry does not vary by the store and the data layer at once.
 */
export const installStore: InstallStore = () => {
  // Nothing to install.
};
