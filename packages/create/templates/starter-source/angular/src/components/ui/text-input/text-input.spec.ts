import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { TextInput } from './text-input';

const create = (multiline: boolean, error?: string): ComponentFixture<TextInput> => {
  const harness = TestBed.createComponent(TextInput);

  harness.componentRef.setInput('name', 'email');
  harness.componentRef.setInput('label', 'Email');
  harness.componentRef.setInput('value', 'typed');
  harness.componentRef.setInput('multiline', multiline);
  harness.componentRef.setInput('error', error);

  return harness;
};

describe('TextInput', () => {
  it('labels a single-line field and reports what is typed and when it is left', async () => {
    const harness = create(false);
    const typed: string[] = [];
    let left = 0;

    harness.componentInstance.valueChange
      .subscribe((value) => {
        typed.push(value);
      });

    harness.componentInstance.blurred
      .subscribe(() => {
        left += 1;
      });

    await harness.whenStable();

    const root = harness.nativeElement as HTMLElement;
    const field = root.querySelector('input');

    if (field === null) {
      throw new Error('No input rendered');
    }

    field.value = 'next';
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));

    expect(root.querySelector('label')?.htmlFor).toBe('email');
    expect(field.getAttribute('aria-invalid')).toBe('false');
    expect(typed).toEqual(['next']);
    expect(left).toBe(1);
  });

  it('renders a textarea, and an error it points at', async () => {
    const harness = create(true, 'Too short.');
    const typed: string[] = [];
    let left = 0;

    harness.componentInstance.valueChange
      .subscribe((value) => {
        typed.push(value);
      });

    harness.componentInstance.blurred
      .subscribe(() => {
        left += 1;
      });

    await harness.whenStable();

    const root = harness.nativeElement as HTMLElement;
    const field = root.querySelector('textarea');

    if (field === null) {
      throw new Error('No textarea rendered');
    }

    field.value = 'more';
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));

    expect(field.getAttribute('aria-describedby')).toBe('email-error');
    expect(root.querySelector('#email-error')?.textContent).toBe('Too short.');
    expect(typed).toEqual(['more']);
    expect(left).toBe(1);
  });
});
