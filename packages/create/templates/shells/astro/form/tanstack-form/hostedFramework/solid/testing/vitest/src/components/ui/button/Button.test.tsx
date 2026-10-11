import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { Button } from './Button';

describe('Button', () => {
  it('answers the press', () => {
    const pressed: string[] = [];

    render(() => {
      return (
        <Button onClick={() => {
          pressed.push('add');
        }}
        >
          Add one
        </Button>
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const expected = ['add'];
    expect(pressed).toEqual(expected);
  });

  it('submits a form when it is asked to', () => {
    render(() => {
      return <Button type="submit">Send</Button>;
    });

    const button = screen.getByRole('button', { name: 'Send' });

    fireEvent.click(button);

    const attribute = button.getAttribute('type');
    expect(attribute).toBe('submit');
  });

  it('is inert while disabled', () => {
    render(() => {
      return <Button disabled>Send</Button>;
    });

    const disabledHasAttribute = screen.getByRole('button', { name: 'Send' }).hasAttribute('disabled');
    expect(disabledHasAttribute).toBe(true);
  });
});
