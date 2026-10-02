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

    const attribute = input.getAttribute('type');
    expect(attribute).toBe('email');
    const ariaInvalidAttribute = input.getAttribute('aria-invalid');
    expect(ariaInvalidAttribute).toBe('false');

    fireEvent.input(input, { target: { value: 'someone@example.com' } });

    const expected = ['someone@example.com'];
    expect(typed).toEqual(expected);
  });

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

    const attribute = input.getAttribute('type');
    expect(attribute).toBe('text');

    fireEvent.input(input, { target: { value: 'Ada' } });

    const expected = ['Ada'];
    expect(typed).toEqual(expected);
  });

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

    const attribute = area.getAttribute('aria-describedby');
    expect(attribute).toBe('message-error');
    const element = screen.getByText('Write at least ten characters.');
    expect(element).toBeTruthy();

    fireEvent.input(area, { target: { value: 'long enough now' } });
    fireEvent.blur(area);

    const expected = ['long enough now'];
    expect(typed).toEqual(expected);
    const expected2 = ['message'];
    expect(blurred).toEqual(expected2);
  });
});
