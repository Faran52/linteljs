import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { PAGES } from '@config/routes';

import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import { applyLanguage, language } from '@i18n/i18n';

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

  const opened = {
    root: harness.nativeElement as HTMLElement,
    settle: async () => {
      await harness.whenStable();
    },
  };

  return opened;
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
        const entry = {
          id: option.value,
          lang: option.lang,
          label: option.textContent.trim(),
        };

        return entry;
      });

    const expected = languages
      .map((option) => {
        const entry = {
          id: option.id,
          lang: option.id,
          label: option.label,
        };

        return entry;
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

    const applied = language();
    const stored = localStorage.getItem(languageStorageKey);

    expect(applied).toBe(last);
    expect(stored).toBe(last);
  });

  it('marks the page it is on with the class the stylesheet colours', async () => {
    const { root, settle } = await open();

    await TestBed
      .inject(Router)
      .navigateByUrl('/');

    await settle();

    const current = root.querySelector('nav a[aria-current="page"]');
    const marked = current?.classList.contains('tab-current');

    expect(marked).toBe(true);
  });
});
