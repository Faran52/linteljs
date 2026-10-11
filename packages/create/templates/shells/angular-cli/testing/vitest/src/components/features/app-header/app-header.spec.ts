import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { PAGES } from '@config/routes';

import { languages, resources } from '@i18n/config';
import { applyLanguage } from '@i18n/i18n';

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

  it('marks the page it is on and styles its tab apart', async () => {
    const { root, settle } = await open();

    await TestBed
      .inject(Router)
      .navigateByUrl('/');

    await settle();

    const current = root.querySelector('nav a[aria-current="page"]');
    const other = root.querySelector('nav a:not([aria-current])');
    const currentClass = current?.className;

    expect(currentClass).toBeDefined();
    expect(currentClass).not.toBe(other?.className);
  });
});
