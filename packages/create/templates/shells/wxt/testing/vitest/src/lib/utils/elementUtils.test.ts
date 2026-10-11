import { describe, expect, it } from 'vitest';

import { applyStyles } from './elementUtils';

describe('applyStyles', () => {
  it('sets each attribute the entry carries', () => {
    const element = document.createElement('p');

    applyStyles(element, { class: 'lede', style: 'color: red' });

    const style = element.getAttribute('style');
    expect(element.className).toBe('lede');
    expect(style).toBe('color: red');
  });

  it('leaves an attribute the entry lacks unset', () => {
    const element = document.createElement('p');

    applyStyles(element, { class: 'lede', style: undefined });

    const hasStyle = element.hasAttribute('style');
    expect(hasStyle).toBe(false);
  });
});
