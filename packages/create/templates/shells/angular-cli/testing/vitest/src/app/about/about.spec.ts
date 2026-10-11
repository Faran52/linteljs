import { TestBed } from '@angular/core/testing';

import { CHECK, SYNC } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import { languages, resources } from '@i18n/config';
import { applyLanguage } from '@i18n/i18n';

import { About } from './about';

const last = languages.at(-1)?.id ?? 'en';

const textsOf = (root: HTMLElement, selector: string): string[] => {
  const elements = [...root.querySelectorAll(selector)];

  return elements
    .map((element) => {
      return element.textContent.trim();
    });
};

describe('About', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('renders every line in the language applied, each command as code', async () => {
    applyLanguage(last);

    const harness = TestBed.createComponent(About);

    await harness.whenStable();

    const root = harness.nativeElement as HTMLElement;
    const { common } = resources[last];
    const holds = STANDARD_PATHS
      .map((entry) => {
        return common[entry.holds];
      });
    const sectionTitles = textsOf(root, '.section-title');
    const shownHolds = textsOf(root, 'dd');
    const noteCommands = textsOf(root, '.note code');

    expect(root.querySelector('.page-title')?.textContent).toBe(common.about);
    expect(root.querySelector('.page-lede')?.textContent).toBe(common.aboutLede);

    expect(sectionTitles).toEqual([
      common.aboutGate,
      common.aboutStandard,
      common.aboutCurrent,
    ]);

    expect(shownHolds).toEqual(holds);
    expect(noteCommands).toEqual([CHECK, SYNC]);
    expect(root.textContent).not.toMatch(/[{}<>]/u);
  });
});
