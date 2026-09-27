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

    expect(input.getAttribute('type')).toBe('email');
    expect(input.getAttribute('aria-invalid')).toBe('false');

    await fireEvent.input(input, { target: { value: 'someone@example.com' } });

    expect(typed).toEqual(['someone@example.com']);
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

    expect(area.getAttribute('aria-describedby')).toBe('message-error');
    expect(screen.getByText('Write at least ten characters.')).toBeTruthy();

    await fireEvent.input(area, { target: { value: 'long enough now' } });
    await fireEvent.blur(area);

    expect(typed).toEqual(['long enough now']);
    expect(blurred).toEqual(['message']);
  });
});
