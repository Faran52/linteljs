import { TestBed } from '@angular/core/testing';

import { Button } from './button';

describe('Button', () => {
  it('is a plain button unless told otherwise', async () => {
    const harness = TestBed.createComponent(Button);

    await harness.whenStable();

    const button = (harness.nativeElement as HTMLElement).querySelector('button');

    expect(button?.type).toBe('button');
    expect(button?.disabled).toBe(false);
  });

  it('submits and disables on request', async () => {
    const harness = TestBed.createComponent(Button);

    harness.componentRef.setInput('type', 'submit');
    harness.componentRef.setInput('disabled', true);
    await harness.whenStable();

    const button = (harness.nativeElement as HTMLElement).querySelector('button');

    expect(button?.type).toBe('submit');
    expect(button?.disabled).toBe(true);
  });
});
