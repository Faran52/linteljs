import { render } from '@testing-library/svelte';

import CodeText from './CodeText.svelte';

describe('CodeText', () => {
  it('sets each marked command in code, and the rest as text', () => {
    const { container } = render(CodeText, { text: 'Recorded in <code>a.json</code>, which <code>sync</code> reads.' });

    const codes = [...container.querySelectorAll('code')]
      .map((code) => {
        return code.textContent;
      });

    const expected = ['a.json', 'sync'];
    expect(codes).toEqual(expected);
    expect(container.textContent).toBe('Recorded in a.json, which sync reads.');
  });

  it('leaves a line with nothing marked as text alone', () => {
    const { container } = render(CodeText, { text: '<b>plain</b>' });

    const element = container.querySelector('code');
    expect(element).toBeNull();
    expect(container.textContent).toBe('<b>plain</b>');
  });
});
