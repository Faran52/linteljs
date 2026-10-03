import { TestBed } from '@angular/core/testing';

import { CHECK, NAME } from '@config/linteljs';

import { applyLanguage } from '@i18n';
import { languages, resources } from '@i18n/config';

import { Home } from './home';

const last = languages.at(-1)?.id ?? 'en';

describe('Home', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('renders the lede and the gate hint in the language applied', async () => {
    applyLanguage(last);

    const harness = TestBed.createComponent(Home);

    await harness.whenStable();

    const root = harness.nativeElement as HTMLElement;
    const { common } = resources[last];
    const title = root.querySelector('.title')?.textContent;
    const lede = root.querySelector('.lede')?.textContent;
    const command = root.querySelector('.hint code')?.textContent;

    expect(title).toBe(NAME);
    expect(lede).toBe(common.homeLedeAngular);
    expect(command).toBe(CHECK);
    expect(root.textContent).not.toMatch(/[{}<>]/u);
  });
});
