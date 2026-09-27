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

  it('points at the gate, as every home page does', () => {
    const root = open();

    const hint = root.querySelector('.hint')?.textContent;

    expect(hint).toBe('Run pnpm check for lint, types, tests and build.');
    expect(root.querySelector('button')).toBeNull();
  });
});
