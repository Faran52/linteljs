import { fireEvent, screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import { TextInput, type TextInputProps } from './TextInput';

describe('TextInput', () => {
  it('labels an email field, opens the email keyboard and answers with what was typed', async () => {
    const typed: string[] = [];

    // Spread, as the contact screen binds a field.
    const field: TextInputProps = {
      id: 'email',
      label: 'Email',
      type: 'email',
      value: '',
      error: undefined,
      onChange: (value) => {
        typed.push(value);
      },
    };

    await renderScreen(<TextInput {...field} />);

    const input = screen.getByLabelText('Email');

    expect(input).toHaveProp('keyboardType', 'email-address');
    expect(input).toHaveProp('multiline', false);
    expect(input).not.toHaveProp('accessibilityHint');

    await fireEvent.changeText(input, 'someone@example.com');

    const expected = ['someone@example.com'];
    expect(typed).toEqual(expected);
  });

  it('defaults to a plain text field and describes a multiline one by its error', async () => {
    const field: TextInputProps = {
      id: 'message',
      label: 'Message',
      multiline: true,
      value: 'hi',
      error: 'Write at least ten characters.',
      onChange: jest.fn(),
    };

    await renderScreen(<TextInput {...field} />);

    const area = screen.getByLabelText('Message');

    expect(area).toHaveProp('keyboardType', 'default');
    expect(area).toHaveProp('multiline', true);
    expect(area).toHaveProp('accessibilityHint', 'Write at least ten characters.');
    const element = screen.getByText('Write at least ten characters.');
    expect(element).toBeTruthy();
  });
});
