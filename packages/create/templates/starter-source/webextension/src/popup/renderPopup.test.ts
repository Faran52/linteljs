import { NAME } from '../config/linteljs';

import { renderPopup } from './renderPopup';

describe('renderPopup', () => {
  const open = (): HTMLElement => {
    const root = document.createElement('div');

    renderPopup(root);

    return root;
  };

  it('carries the project name and the mark', () => {
    const root = open();

    expect(root.querySelector('h1')?.textContent).toBe(NAME);
    expect(root.querySelector('svg[role="img"]')).not.toBeNull();
  });

  it('counts up when its button is pressed', () => {
    const root = open();

    expect(root.querySelector('.count')?.textContent).toBe('0');

    root
      .querySelector('button')
      ?.click();

    expect(root.querySelector('.count')?.textContent).toBe('1');
  });
});
