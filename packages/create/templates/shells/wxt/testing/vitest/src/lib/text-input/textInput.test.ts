import { describe, expect, it } from 'vitest';

import { textInput } from './textInput';

describe('textInput', () => {
  it('labels its input by id', () => {
    const field = textInput({ id: 'email', label: 'Email', error: undefined, type: 'email' });

    const input = field.querySelector('input');
    const labelFor = field.querySelector('label')?.htmlFor;
    expect(input?.type).toBe('email');
    expect(labelFor).toBe('email');
  });

  it('marks a valid control and shows no error', () => {
    const field = textInput({ id: 'name', label: 'Name', error: undefined });

    const invalid = field.querySelector('input')?.getAttribute('aria-invalid');
    const errorElement = field.querySelector('p');
    expect(invalid).toBe('false');
    expect(errorElement).toBeNull();
  });

  it('describes an invalid control by its error', () => {
    const field = textInput({ id: 'message', label: 'Message', error: 'Required', multiline: true });

    const control = field.querySelector('textarea');
    const describedBy = control?.getAttribute('aria-describedby');
    const errorText = field.querySelector(`#${describedBy}`)?.textContent;
    const invalid = control?.getAttribute('aria-invalid');
    expect(invalid).toBe('true');
    expect(errorText).toBe('Required');
  });
});
