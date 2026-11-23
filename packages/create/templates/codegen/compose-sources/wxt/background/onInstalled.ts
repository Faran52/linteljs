import type { InstalledDetails } from './browser';

// @lintel:comment ./browser#installedComment
export const onInstalled = (details: InstalledDetails): void => {
  if (details.reason !== 'install') {
    return;
  }

  console.warn('Extension installed.');
};
