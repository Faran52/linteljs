import { TestBed } from '@angular/core/testing';

import { ANSWERS, STACK } from '@config/linteljs';

import { Version } from './version';

describe('Version', () => {
  it('renders every recorded row of the stack and every answer', async () => {
    const harness = TestBed.createComponent(Version);

    await harness.whenStable();

    const text = (harness.nativeElement as HTMLElement).textContent;

    for (const { name, version } of STACK) {
      expect(text).toContain(name);
      expect(text).toContain(version);
    }

    for (const { label, value } of ANSWERS) {
      expect(text).toContain(label);
      expect(text).toContain(value);
    }
  });
});
