import { inject } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterStore } from '@store/counter/counter-store';

import { Button } from '@ui/button/button';

import { Home } from './home';

export const storeImports = [Button];

export class StoreMembers {
  protected readonly counter = inject(CounterStore);
}

export const storeCases = (rootOf: (harness: ComponentFixture<Home>) => HTMLElement): void => {
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
};
