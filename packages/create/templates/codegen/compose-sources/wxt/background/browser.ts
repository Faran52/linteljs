import type { Browser } from 'wxt/browser';

export type InstalledDetails = Browser.runtime.InstalledDetails;

export const installed: Record<'first' | 'update', InstalledDetails> = {
  first: { reason: 'install' },
  update: { reason: 'update' },
};

export const browserCases = (): void => {};
