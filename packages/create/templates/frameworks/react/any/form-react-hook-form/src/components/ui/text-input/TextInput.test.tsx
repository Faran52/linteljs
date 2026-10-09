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

    const attribute = input.getAttribute('type');
    expect(attribute).toBe('email');
    const ariaInvalidAttribute = input.getAttribute('aria-invalid');
    expect(ariaInvalidAttribute).toBe('false');

    fireEvent.change(input, { target: { value: 'someone@example.com' } });

    const expected = ['someone@example.com'];
    expect(typed).toEqual(expected);
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

    const attribute = area.getAttribute('aria-describedby');
    expect(attribute).toBe('message-error');
    const element = screen.getByText('Write at least ten characters.');
    expect(element).toBeTruthy();

    fireEvent.change(area, { target: { value: 'long enough now' } });

    const expected = ['long enough now'];
    expect(typed).toEqual(expected);
  });
});
