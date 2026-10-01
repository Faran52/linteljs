import { render } from '@solidjs/testing-library';

import { CodeText } from './CodeText';

describe('CodeText', () => {
  it('sets each marked part as code and the rest as text', () => {
    const { container } = render(() => {
      return <CodeText text="<code>pnpm check</code> runs <code>lint</code> first" />;
    });

    const codes = [...container.querySelectorAll('code')]
      .map((code) => {
        return code.textContent;
      });

    expect(codes).toEqual(['pnpm check', 'lint']);
    expect(container.textContent).toBe('pnpm check runs lint first');
  });

  it('renders markup it does not mark as text', () => {
    const { container } = render(() => {
      return <CodeText text="<b>bold</b>" />;
    });

    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toBe('<b>bold</b>');
  });
});
