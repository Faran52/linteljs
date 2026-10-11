import {
  fireEvent,
  render,
  screen,
} from '@testing-library/svelte';

import CounterProbe from '@mocks/CounterProbe.svelte';

describe('useCounter', () => {
  it('counts up, and every reader sees the same count', async () => {
    render(CounterProbe);

    const button = screen.getByRole('button', { name: 'one 0' });

    await fireEvent.click(button);

    const actual = button.textContent;
    expect(actual).toBe('one 1');
    const actual2 = screen.getByTestId('two').textContent;
    expect(actual2).toBe('two 1');
  });
});
