import type { App } from 'vue';

export type InstallData = (app: App) => void;

export const installData: InstallData = () => {
  // Nothing to install.
};
