import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { ContactIsland } from './ContactIsland';

const fill = (label: string, value: string): void => {
  const field = screen.getByLabelText(label);

  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};

describe('ContactIsland', () => {
  it('refuses what the rules refuse, and says why beside the field', async () => {
    render(<ContactIsland />);
    fill('Email', 'not-an-address');

    const element = await screen.findByText('Enter a valid email address.');
    expect(element).toBeTruthy();
  });

  it('flags only the field that was left', async () => {
    render(<ContactIsland />);
    fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');

    const untouched = screen.queryByText('Write a message of at least ten characters.');

    expect(untouched).toBeNull();
  });

  it('clears an error as soon as the value is valid', async () => {
    render(<ContactIsland />);
    fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'someone@example.com' } });

    await waitFor(() => {
      const stale = screen.queryByText('Enter a valid email address.');

      expect(stale).toBeNull();
    });
  });

  it('lets a send name the field still missing', async () => {
    render(<ContactIsland />);
    fill('Email', 'someone@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    const element = await screen.findByText('Write a message of at least ten characters.');
    expect(element).toBeTruthy();
  });

  it('sends once both fields are valid', async () => {
    render(<ContactIsland />);
    fill('Email', 'someone@example.com');
    fill('Message', 'Ten characters, at least.');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    const element = await screen.findByRole('status');
    expect(element).toBeTruthy();
  });
});
