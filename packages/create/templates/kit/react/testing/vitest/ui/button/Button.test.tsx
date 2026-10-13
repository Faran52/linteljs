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

    const expected = ['add'];
    expect(pressed).toEqual(expected);
  });

  it('submits a form when it is asked to, and is inert while disabled', () => {
    render(<Button type="submit" disabled>Send</Button>);

    const button = screen.getByRole('button', { name: 'Send' });

    const attribute = button.getAttribute('type');
    expect(attribute).toBe('submit');
    const disabledHasAttribute = button.hasAttribute('disabled');
    expect(disabledHasAttribute).toBe(true);
  });
});
