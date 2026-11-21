import type { Browser } from 'wxt/browser';

export const installed: Record<'first' | 'update', Browser.runtime.InstalledDetails> = {
  first: { reason: 'install' },
  update: { reason: 'update' },
};

export const browserCases = (): void => {};
