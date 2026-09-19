import { setupCounter } from './counter';

describe('setupCounter', () => {
  it('counts a click', () => {
    const button = document.createElement('button');

    setupCounter(button);

    expect(button.innerHTML).toBe('Count is 0');

    button.click();

    expect(button.innerHTML).toBe('Count is 1');
  });
});
