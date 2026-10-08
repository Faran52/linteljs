import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';

import { renderPanel } from './panel';

const last = languages.at(-1)?.id ?? 'en';

describe('renderPanel', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('writes a main landmark with one heading in the stored language', () => {
    localStorage.setItem(languageStorageKey, last);
    const root = document.createElement('div');

    renderPanel(root);

    const heading = root.querySelector('main > h1')?.textContent;
    const status = root.querySelector('main > p')?.textContent;
    expect(heading).toBe(resources[last].common.panel);
    expect(status).toBe(resources[last].common.panelReady);
    expect(document.documentElement.lang).toBe(last);
  });
});
