import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { CHECK, NAME } from '@config/linteljs';

import { languages, resources } from '@i18n/config';
import { applyLanguage } from '@i18n/i18n';

import { Home } from './home';

const last = languages.at(-1)?.id ?? 'en';

const rootOf = (harness: ComponentFixture<Home>): HTMLElement => {
  if (!(harness.nativeElement instanceof HTMLElement)) {
    throw new TypeError('The home page did not render');
  }

  return harness.nativeElement;
};

describe('Home', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('renders the lede and the gate hint in the language applied', async () => {
    applyLanguage(last);

    const harness = TestBed.createComponent(Home);

    await harness.whenStable();

    const root = rootOf(harness);
    const { common } = resources[last];
    const title = root.querySelector('h1')?.textContent;
    const lede = root.querySelector('h1 + p')?.textContent;
    const command = root.querySelector('code')?.textContent;

    expect(title).toBe(NAME);
    expect(lede).toBe(common.homeLedeAngular);
    expect(command).toBe(CHECK);
    expect(root.textContent).not.toMatch(/[{}<>]/u);
  });

  it('counts up when the button it holds is pressed', async () => {
    const harness = TestBed.createComponent(Home);

    await harness.whenStable();

    const root = rootOf(harness);

    root
      .querySelector('button')
      ?.click();

    await harness.whenStable();

    const count = root.querySelector('[aria-live]')?.textContent;
    expect(count).toBe('1');
  });
});
