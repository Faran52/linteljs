import { describe, expect, it } from 'vitest';

import { applyStyles, attributesOf } from './elementUtils';

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

describe('attributesOf', () => {
  it('writes each attribute the entry carries', () => {
    const text = attributesOf({ class: 'mark', style: 'color: red' });

    expect(text).toBe('class="mark" style="color: red"');
  });

  it('skips an attribute the entry lacks', () => {
    const text = attributesOf({ class: 'mark', style: undefined });

    expect(text).toBe('class="mark"');
  });

  it('escapes an ampersand in a value', () => {
    const text = attributesOf({ style: 'a&b' });

    expect(text).toBe('style="a&amp;b"');
  });

  it('escapes a double quote in a value', () => {
    const text = attributesOf({ class: 'a"b' });

    expect(text).toBe('class="a&quot;b"');
  });
});
