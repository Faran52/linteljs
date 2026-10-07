import { TestBed } from '@angular/core/testing';

import { CHECK, NAME } from '@config/linteljs';

import { Home } from './home';

describe('Home', () => {
  it('carries the project name, the mark and the gate command', async () => {
    const harness = TestBed.createComponent(Home);

    await harness.whenStable();

    const root = harness.nativeElement as HTMLElement;
    const title = root.querySelector('.title')?.textContent;
    const drawn = root.querySelector('svg[role="img"]');
    const command = root.querySelector('.hint code')?.textContent;

    expect(title).toBe(NAME);
    expect(drawn).not.toBeNull();
    expect(command).toBe(CHECK);
  });
});
