import type { Browser } from '@config/types';
import type { PluginSpec } from '../types';

export interface BrowserParts {
  types: string[];
  devDependencies: string[];
}

export const BROWSERS: Record<Browser, BrowserParts> = {
  chrome: {
    // Without the types extension code fails `typecheck`; once listed, `types` is an allow-list.
    types: ['chrome'],
    devDependencies: ['@types/chrome'],
  },
  firefox: {
    // These types carry no `chrome`, so Chrome's starter does not typecheck here.
    types: ['firefox-webext-browser'],
    devDependencies: ['@types/firefox-webext-browser'],
  },
};

export const CRX: PluginSpec = {
  imports: [
    "import { crx } from '@crxjs/vite-plugin';",
    "import manifest from './manifest.json' with { type: 'json' };",
  ],
  calls: ['crx({ manifest })'],
};

// A popup closes when it loses focus, so it carries no nav and no second page.
export const POPUP: readonly string[] = [
  'src/main.ts',
  'src/popup/renderPopup.ts',
  'src/counter.ts',
  'src/lib/mark.ts',
];

export const SHARED: readonly string[] = [
  'src/styles/tokens.css',
  'src/styles/base.css',
];
