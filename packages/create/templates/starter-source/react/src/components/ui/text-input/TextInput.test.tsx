import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('binds a visible label to the control and answers with what was typed', () => {
    const typed: string[] = [];

    render(
      <TextInput
        id="email"
        label="Email"
        type="email"
        value=""
        error={undefined}
        onChange={(value) => {
          typed.push(value);
        }}
      />,
    );

    const input = screen.getByLabelText('Email');

    expect(input.getAttribute('type')).toBe('email');
    expect(input.getAttribute('aria-invalid')).toBe('false');

    fireEvent.change(input, { target: { value: 'someone@example.com' } });

    expect(typed).toEqual(['someone@example.com']);
  });

  it('describes a multiline field by its error', () => {
    const typed: string[] = [];

    render(
      <TextInput
        id="message"
        label="Message"
        multiline
        value="hi"
        error="Write at least ten characters."
        onChange={(value) => {
          typed.push(value);
        }}
      />,
    );

    const area = screen.getByLabelText('Message');

    expect(area.getAttribute('aria-describedby')).toBe('message-error');
    expect(screen.getByText('Write at least ten characters.')).toBeTruthy();

    fireEvent.change(area, { target: { value: 'long enough now' } });

    expect(typed).toEqual(['long enough now']);
  });
});
