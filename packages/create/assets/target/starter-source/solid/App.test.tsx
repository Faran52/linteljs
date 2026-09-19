import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import App from './App';

describe('App', () => {
  it('counts a click', () => {
    render(() => {
      return <App />;
    });

    const button = screen.getByRole('button');

    expect(button.textContent).toContain('0');

    fireEvent.click(button);

    expect(button.textContent).toContain('1');
  });
});
