import { renderPanel } from './panel';

describe('renderPanel', () => {
  it('writes a main landmark with the starter label over one heading into the element it is handed', () => {
    const root = document.createElement('div');

    renderPanel(root);

    const heading = root.querySelector('main > h1')?.textContent;
    const label = root.querySelector('main > h1')?.previousElementSibling;
    const status = root.querySelector('main > h1 + p')?.textContent;
    expect(label?.className).toBe('starter-label');
    expect(label?.textContent).toBe('LintelJS Starter');
    expect(heading).toBe('Panel');
    expect(status).toBe('Ready.');
  });
});
