import { render } from '@testing-library/react';

import { CodeText } from './CodeText';

describe('CodeText', () => {
  it('sets each marked part as code and the rest as text', () => {
    const { container } = render(<CodeText text="<code>pnpm check</code> runs <code>lint</code> first" tone="primary" />);

    const codes = [...container.querySelectorAll('code')]
      .map((code) => {
        return code.textContent;
      });

    const expected = ['pnpm check', 'lint'];
    expect(codes).toEqual(expected);
    expect(container.textContent).toBe('pnpm check runs lint first');
  });

  it('renders markup it does not mark as text', () => {
    const { container } = render(<CodeText text="<b>bold</b>" tone="primary" />);

    const element = container.querySelector('b');
    expect(element).toBeNull();
    expect(container.textContent).toBe('<b>bold</b>');
  });
});
