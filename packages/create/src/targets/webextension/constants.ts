import type { Browser } from '@config/types';
// What a browser contributes, what crx is wired as, and the popup every project gets.
import type { PluginSpec } from '../types';

export interface BrowserParts {
  types: string[];
  devDependencies: string[];
}

export const BROWSERS: Record<Browser, BrowserParts> = {
  chrome: {
    // Without the types the first line of extension code fails `typecheck`; once listed, `types` is an allow-list.
    types: ['chrome'],
    devDependencies: ['@types/chrome'],
  },
  firefox: {
    // `browser.*`, promise-returning; these types carry no `chrome`, so Chrome's starter does not typecheck here.
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

/**
 * Every file the popup is, which is every project: the manifest always names one. No `scaffold` on this record, so
 * `index.html` is emitted from `htmlEntry` and everything under it is written here.
 *
 * A popup is a panel a few hundred pixels wide that closes when it loses focus, so it carries no nav and no second
 * page. The extension's other surfaces are its other entries, and a surface answer is what adds them.
 */
export const POPUP: readonly string[] = [
  'src/main.ts',
  'src/popup/renderPopup.ts',
  'src/counter.ts',
  'src/lib/mark.ts',
];

// The same bytes on every target; a popup has no header, so it takes the tokens and the stylesheet alone.
export const SHARED: readonly string[] = [
  'src/styles/tokens.css',
  'src/styles/base.css',
];
