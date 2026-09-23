import type { App } from 'vue';

export type InstallData = (app: App) => void;

/*
 * The slot a data layer fills. With none there is nothing to install, so this does nothing and TanStack Query
 * replaces this file with its own plugin.
 */
export const installData: InstallData = () => {
  // Nothing to install.
};
