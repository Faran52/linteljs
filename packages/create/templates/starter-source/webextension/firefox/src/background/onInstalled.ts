// Firefox implements this surface under `browser.*`, promise-returning.
export const onInstalled = (details: browser.runtime._OnInstalledDetails): void => {
  if (details.reason !== 'install') {
    return;
  }

  console.warn('Extension installed.');
};
