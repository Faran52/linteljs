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

    expect(pressed).toEqual(['add']);
  });

  // A form's submit is the one that is not a plain button, and the only reason this prop exists. It carries no
  // press of its own, since the form's own submit is what it raises.
  it('submits a form when it is asked to', () => {
    render(() => {
      return <Button type="submit">Send</Button>;
    });

    const button = screen.getByRole('button', { name: 'Send' });

    fireEvent.click(button);

    expect(button.getAttribute('type')).toBe('submit');
  });

  it('is inert while disabled', () => {
    render(() => {
      return <Button disabled>Send</Button>;
    });

    expect(screen.getByRole('button', { name: 'Send' }).hasAttribute('disabled')).toBe(true);
  });
});
