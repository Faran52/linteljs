export type InstalledDetails = chrome.runtime.InstalledDetails;

export const installed = {
  first: { reason: 'install' },
  update: {
    reason: 'update',
    previousVersion: '0.1.0',
  },
};

export const browserCases = (): void => {};
