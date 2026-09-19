import { renderPanel } from './renderPanel';

describe('renderPanel', () => {
  it('writes into the element it is handed', () => {
    const root = document.createElement('div');

    renderPanel(root);

    expect(root.textContent).toBe('Panel ready.');
  });
});
