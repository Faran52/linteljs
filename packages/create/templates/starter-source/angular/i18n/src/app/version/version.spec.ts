import { TestBed } from '@angular/core/testing';

import { languages, resources } from '@i18n/config';
import { applyLanguage } from '@i18n/i18n';

import { Version } from './version';

const last = languages.at(-1)?.id ?? 'en';

const textsOf = (root: HTMLElement, selector: string): string[] => {
  const elements = [...root.querySelectorAll(selector)];

  return elements
    .map((element) => {
      return element.textContent.trim();
    });
};

describe('Version', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('renders every line in the language applied, each recorded name as code', async () => {
    applyLanguage(last);

    const harness = TestBed.createComponent(Version);

    await harness.whenStable();

    const root = harness.nativeElement as HTMLElement;
    const { common } = resources[last];

    const sectionTitles = textsOf(root, '.section-title');
    const noteCode = textsOf(root, '.note code');

    expect(root.querySelector('.page-title')?.textContent).toBe(common.version);
    expect(root.querySelector('.page-lede')?.textContent).toBe(common.versionLede);
    expect(sectionTitles).toEqual([common.versionStack, common.versionAnswers]);
    expect(noteCode).toEqual(['linteljs.config.json', 'sync']);
    expect(root.textContent).not.toMatch(/[{}<>]/u);
  });
});
