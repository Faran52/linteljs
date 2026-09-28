import { rollupInputs } from './inputUtils';

describe('rollupInputs', () => {
  it('writes nothing where the target names no extra page', () => {
    expect(rollupInputs(undefined)).toBe('');
  });

  it('names every page in one input map', () => {
    expect(rollupInputs({
      panel: 'panel.html',
      options: 'options.html',
    })).toBe("  build: { rollupOptions: { input: { panel: 'panel.html', options: 'options.html' } } },\n");
  });
});
