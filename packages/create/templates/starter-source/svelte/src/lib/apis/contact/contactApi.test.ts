import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/svelte';

import ContactApiProbe from '@mocks/ContactApiProbe.svelte';
import WithData from '@mocks/WithData.svelte';

const press = async (name: string): Promise<string> => {
  render(WithData, { page: ContactApiProbe });
  await fireEvent.click(screen.getByRole('button', { name }));

  const outcome = screen.getByTestId('outcome');

  await waitFor(() => {
    expect(outcome.textContent).not.toBe('waiting');
  });

  return outcome.textContent;
};

describe('useSubmitContact', () => {
  it('answers 200 for details the rules accept', async () => {
    const actual = await press('accepted');
    expect(actual).toBe('sent 200');
  });

  it('refuses details the rules refuse', async () => {
    const actual = await press('refused');
    expect(actual).toBe('refused');
  });
});
