import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { Button } from './Button';

describe('Button', () => {
  it('answers the press', () => {
    const pressed: string[] = [];

    render(
      <Button onClick={() => {
        pressed.push('add');
      }}
      >
        Add one
      </Button>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    expect(pressed).toEqual(['add']);
  });

  it('submits a form when it is asked to, and is inert while disabled', () => {
    render(<Button type="submit" disabled>Send</Button>);

    const button = screen.getByRole('button', { name: 'Send' });

    expect(button.getAttribute('type')).toBe('submit');
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});
