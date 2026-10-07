import { renderPanel } from './panel';

describe('renderPanel', () => {
  it('writes a main landmark with one heading into the element it is handed', () => {
    const root = document.createElement('div');

    renderPanel(root);

    const heading = root.querySelector('main > h1')?.textContent;
    const status = root.querySelector('main > p')?.textContent;
    expect(heading).toBe('Panel');
    expect(status).toBe('Ready.');
  });
});
