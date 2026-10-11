import type { App } from 'vue';

export type DataProvider = (app: App) => void;

export const dataProvider: DataProvider = () => {
  // Nothing to install.
};
