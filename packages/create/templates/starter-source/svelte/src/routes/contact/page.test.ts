import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/svelte';

import WithData from '@mocks/WithData.svelte';

import Page from './+page.svelte';

const renderPage = (): void => {
  render(WithData, { page: Page });
};

const fill = async (label: string, value: string): Promise<void> => {
  const field = screen.getByLabelText(label);

  await fireEvent.input(field, { target: { value } });
  await fireEvent.blur(field);
};

describe('contact page', () => {
  it('refuses what the rules refuse, and says why beside the field', async () => {
    renderPage();
    await fill('Email', 'not-an-address');

    const element = await screen.findByText('Enter a valid email address.');
    expect(element).toBeTruthy();
  });

  it('flags only the field that was left', async () => {
    renderPage();
    await fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');

    const untouched = screen.queryByText('Write a message of at least ten characters.');

    expect(untouched).toBeNull();
  });

  it('clears an error as soon as the value is valid', async () => {
    renderPage();
    await fill('Email', 'not-an-address');
    await screen.findByText('Enter a valid email address.');
    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'someone@example.com' } });

    await waitFor(() => {
      const stale = screen.queryByText('Enter a valid email address.');

      expect(stale).toBeNull();
    });
  });

  it('lets a send name the field still missing', async () => {
    renderPage();
    await fill('Email', 'someone@example.com');
    await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    const element = await screen.findByText('Write a message of at least ten characters.');
    expect(element).toBeTruthy();
  });

  it('sends once both fields are valid', async () => {
    renderPage();
    await fill('Email', 'someone@example.com');
    await fill('Message', 'Ten characters, at least.');
    await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    const element = await screen.findByRole('status');
    expect(element).toBeTruthy();
  });
});
