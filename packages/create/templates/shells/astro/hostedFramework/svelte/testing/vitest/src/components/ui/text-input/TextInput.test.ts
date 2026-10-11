import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import TextInput from './TextInput.svelte';

describe('TextInput', () => {
  it('binds a visible label to the control and answers with what was typed', async () => {
    const typed: string[] = [];

    render(TextInput, {
      id: 'email',
      label: 'Email',
      type: 'email',
      value: '',
      error: undefined,
      onChange: (value: string) => {
        typed.push(value);
      },
    });

    const input = screen.getByLabelText('Email');

    const attribute = input.getAttribute('type');
    expect(attribute).toBe('email');
    const ariaInvalidAttribute = input.getAttribute('aria-invalid');
    expect(ariaInvalidAttribute).toBe('false');

    await fireEvent.input(input, { target: { value: 'someone@example.com' } });

    const expected = ['someone@example.com'];
    expect(typed).toEqual(expected);
  });

  it('describes a multiline field by its error', async () => {
    const typed: string[] = [];
    const blurred: string[] = [];

    render(TextInput, {
      id: 'message',
      label: 'Message',
      multiline: true,
      value: 'hi',
      error: 'Write at least ten characters.',
      onBlur: () => {
        blurred.push('message');
      },
      onChange: (value: string) => {
        typed.push(value);
      },
    });

    const area = screen.getByLabelText('Message');

    const attribute = area.getAttribute('aria-describedby');
    expect(attribute).toBe('message-error');
    const element = screen.getByText('Write at least ten characters.');
    expect(element).toBeTruthy();

    await fireEvent.input(area, { target: { value: 'long enough now' } });
    await fireEvent.blur(area);

    const expected = ['long enough now'];
    expect(typed).toEqual(expected);
    const expected2 = ['message'];
    expect(blurred).toEqual(expected2);
  });
});
