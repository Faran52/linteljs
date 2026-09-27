import WithData from '@mocks/WithData.svelte';
import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

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

    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
  });

  it('sends once both fields are valid', async () => {
    renderPage();
    await fill('Email', 'someone@example.com');
    await fill('Message', 'Ten characters, at least.');
    await fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('status')).toBeTruthy();
  });
});
