import { TestBed } from '@angular/core/testing';

import { CodeText } from './code-text';

const render = async (text: string): Promise<HTMLElement> => {
  const harness = TestBed.createComponent(CodeText);

  harness.componentRef.setInput('text', text);
  await harness.whenStable();

  return harness.nativeElement as HTMLElement;
};

describe('CodeText', () => {
  it('renders each marked command as code, and the rest as text', async () => {
    const root = await render('Run <code>pnpm check</code> before <code>sync</code>.');
    const codes = [...root.querySelectorAll('code')]
      .map((code) => {
        return code.textContent;
      });

    expect(codes).toEqual(['pnpm check', 'sync']);
    expect(root.textContent).toBe('Run pnpm check before sync.');
  });

  it('keeps markup other than its marks as text', async () => {
    const root = await render('<b>bold</b>');
    const bold = root.querySelector('b');

    expect(bold).toBeNull();
    expect(root.textContent).toBe('<b>bold</b>');
  });
});
