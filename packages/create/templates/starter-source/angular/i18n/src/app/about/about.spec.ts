import { TestBed } from '@angular/core/testing';

import { CHECK } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import { applyLanguage } from '@i18n';
import { languages, resources } from '@i18n/config';

import { About } from './about';

const last = languages.at(-1)?.id ?? 'en';

const textsOf = (root: HTMLElement, selector: string): string[] => {
  return [...root.querySelectorAll(selector)]
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

    expect(root.querySelector('.page-title')?.textContent).toBe(common.about);
    expect(root.querySelector('.page-lede')?.textContent).toBe(common.aboutLede);

    expect(textsOf(root, '.section-title')).toEqual([
      common.aboutGate,
      common.aboutStandard,
      common.aboutCurrent,
    ]);

    expect(textsOf(root, 'dd')).toEqual(holds);
    expect(textsOf(root, '.note code')).toEqual([CHECK, 'npx @linteljs/create sync']);
    expect(root.textContent).not.toMatch(/[{}<>]/u);
  });
});
