/**
 * `browser.*`, not `chrome.*`: Firefox implements the same surface under that namespace, promise-returning rather than
 * callback-taking, and `@types/firefox-webext-browser` is what declares it. The Chrome twin of this file is the same
 * handler against `chrome.runtime`.
 */
export const onInstalled = (details: browser.runtime._OnInstalledDetails): void => {
  if (details.reason !== 'install') {
    return;
  }

  console.warn('Extension installed.');
};
