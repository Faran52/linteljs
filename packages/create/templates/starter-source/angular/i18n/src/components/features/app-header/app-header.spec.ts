import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PAGES } from '@config/routes';

import { applyLanguage, language } from '@i18n';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';

import { AppHeader } from './app-header';

interface Opened {
  readonly root: HTMLElement;
  readonly settle: () => Promise<void>;
}

const last = languages.at(-1)?.id ?? 'en';

const open = async (): Promise<Opened> => {
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideLocationMocks()] });

  const harness = TestBed.createComponent(AppHeader);

  harness.componentRef.setInput('name', 'app');
  await harness.whenStable();

  return {
    root: harness.nativeElement as HTMLElement,
    settle: async () => {
      await harness.whenStable();
    },
  };
};

describe('AppHeader', () => {
  afterEach(() => {
    localStorage.clear();
    applyLanguage('en');
  });

  it('names each page in the language applied, and follows a switch', async () => {
    const { root, settle } = await open();

    applyLanguage(last);
    await settle();

    const { common } = resources[last];
    const labels = [...root.querySelectorAll('nav a')]
      .map((tab) => {
        return tab.textContent.trim();
      });

    expect(root.querySelector('.starter-label')?.textContent).toBe(common.starterLabel);

    expect(labels).toEqual(expect.arrayContaining([
      common.home,
      common.about,
      common.version,
    ]));

    expect(labels).toHaveLength(PAGES.length);
    const label = root
      .querySelector('select')
      ?.getAttribute('aria-label');

    expect(label).toBe(common.language);
  });

  it('offers every language, and shows the one applied', async () => {
    applyLanguage(last);

    const { root } = await open();
    const select = root.querySelector('select');
    const offered = [...root.querySelectorAll('option')]
      .map((option) => {
        return {
          id: option.value,
          lang: option.lang,
          label: option.textContent.trim(),
        };
      });

    const expected = languages
      .map((option) => {
        return {
          id: option.id,
          lang: option.id,
          label: option.label,
        };
      });

    expect(offered).toEqual(expected);
    expect(select?.value).toBe(last);
  });

  it('stores and applies the language chosen', async () => {
    const { root } = await open();
    const select = root.querySelector('select');

    if (select === null) {
      throw new Error('No language select');
    }

    select.value = last;
    select.dispatchEvent(new Event('change'));

    expect(language()).toBe(last);
    expect(localStorage.getItem(languageStorageKey)).toBe(last);
  });
});
