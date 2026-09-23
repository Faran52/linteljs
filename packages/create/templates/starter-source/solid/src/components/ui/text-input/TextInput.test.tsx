import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('binds a visible label to the control and answers with what was typed', () => {
    const typed: string[] = [];

    render(() => {
      return (
        <TextInput
          id="email"
          label="Email"
          type="email"
          value=""
          error={undefined}
          onChange={(value) => {
            typed.push(value);
          }}
        />
      );
    });

    const input = screen.getByLabelText('Email');

    expect(input.getAttribute('type')).toBe('email');
    expect(input.getAttribute('aria-invalid')).toBe('false');

    fireEvent.input(input, { target: { value: 'someone@example.com' } });

    expect(typed).toEqual(['someone@example.com']);
  });

  // The default, and the common case: a single-line field with no error and nothing to say about its type.
  it('defaults to a plain text field', () => {
    const typed: string[] = [];

    render(() => {
      return (
        <TextInput
          id="name"
          label="Name"
          value=""
          error={undefined}
          onChange={(value) => {
            typed.push(value);
          }}
        />
      );
    });

    const input = screen.getByLabelText('Name');

    expect(input.getAttribute('type')).toBe('text');

    fireEvent.input(input, { target: { value: 'Ada' } });

    expect(typed).toEqual(['Ada']);
  });

  // `aria-describedby` rather than a paragraph that merely sits nearby: a screen reader reads the error with the
  // field, at the moment it lands on it, rather than after the whole form.
  it('describes a multiline field by its error', () => {
    const typed: string[] = [];
    const blurred: string[] = [];

    render(() => {
      return (
        <TextInput
          id="message"
          label="Message"
          multiline
          value="hi"
          error="Write at least ten characters."
          onBlur={() => {
            blurred.push('message');
          }}
          onChange={(value) => {
            typed.push(value);
          }}
        />
      );
    });

    const area = screen.getByLabelText('Message');

    expect(area.getAttribute('aria-describedby')).toBe('message-error');
    expect(screen.getByText('Write at least ten characters.')).toBeTruthy();

    fireEvent.input(area, { target: { value: 'long enough now' } });
    fireEvent.blur(area);

    expect(typed).toEqual(['long enough now']);
    expect(blurred).toEqual(['message']);
  });
});
