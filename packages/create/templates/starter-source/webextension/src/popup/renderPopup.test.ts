import { CHECK, NAME } from '@config/linteljs';

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
    const element = root.querySelector('svg[role="img"]');
    expect(element).not.toBeNull();
  });

  it('points at the gate, as every home page does', () => {
    const root = open();

    const hint = root.querySelector('.hint')?.textContent;

    const expected = `Run ${CHECK} for the full gate.`;

    expect(hint).toBe(expected);
    const element = root.querySelector('button');
    expect(element).toBeNull();
  });
});
