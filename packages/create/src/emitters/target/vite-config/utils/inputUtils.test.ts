import { rollupInputs } from './inputUtils';

describe('rollupInputs', () => {
  it('writes nothing where the target names no extra page', () => {
    const actual = rollupInputs(undefined);
    expect(actual).toBe('');
  });

  it('names every page in one input map', () => {
    const actual = rollupInputs({
      panel: 'panel.html',
      options: 'options.html',
    });
    expect(actual).toBe("  build: { rollupOptions: { input: { panel: 'panel.html', options: 'options.html' } } },\n");
  });
});
