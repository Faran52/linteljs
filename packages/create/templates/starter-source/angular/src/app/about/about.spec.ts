import { TestBed } from '@angular/core/testing';

import { GATE } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import { About } from './about';

describe('About', () => {
  it('lists every leg of the gate and where the standard lives', async () => {
    const harness = TestBed.createComponent(About);

    await harness.whenStable();

    const text = (harness.nativeElement as HTMLElement).textContent;

    for (const { command } of GATE) {
      expect(text).toContain(command);
    }

    for (const { path } of STANDARD_PATHS) {
      expect(text).toContain(path);
    }
  });
});
