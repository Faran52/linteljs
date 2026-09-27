import { stylesFor } from './starter';

describe('stylesFor', () => {
  it('answers the dark tokens for a dark scheme', () => {
    const { colors } = stylesFor('dark');

    expect(colors.background).toBe('#1f2128');
    expect(colors.primary).toBe('#e8a05c');
  });

  it('answers the light tokens otherwise', () => {
    const light = stylesFor('light').colors.background;
    const unset = stylesFor('unspecified').colors.background;

    expect(light).toBe('#faf9f7');
    expect(unset).toBe('#faf9f7');
  });
});
