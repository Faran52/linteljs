import type { resources } from '@i18n/config';

type Common = (typeof resources)[keyof typeof resources]['common'];

export const storeHelpers = (): void => {};

export const storeOpen = (): void => {};

export const storeCases = (): void => {};

export const storeSpoken = (common: Common): void => {};
