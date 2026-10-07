import { TestBed } from '@angular/core/testing';

import { Mark } from './mark';

describe('Mark', () => {
  it('is an image with a name, the beam bare and each line styled', async () => {
    const harness = TestBed.createComponent(Mark);

    await harness.whenStable();

    const root = harness.nativeElement as HTMLElement;
    const label = root
      .querySelector('svg[role="img"]')
      ?.getAttribute('aria-label');
    const lines = [...root.querySelectorAll('path')]
      .map((path) => {
        return path.hasAttribute('class');
      });

    expect(label).toBe('linteljs');

    expect(lines).toEqual([
      false,
      true,
      true,
      true,
    ]);
  });
});
