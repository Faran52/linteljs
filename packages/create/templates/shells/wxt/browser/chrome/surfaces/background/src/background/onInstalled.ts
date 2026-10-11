export const onInstalled = (details: chrome.runtime.InstalledDetails): void => {
  if (details.reason !== 'install') {
    return;
  }

  console.warn('Extension installed.');
};
