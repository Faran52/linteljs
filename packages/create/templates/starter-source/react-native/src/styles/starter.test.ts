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

  // A fixed height would clip a label grown with the system text size.
  it('gives an action a floor for its height, not a height', () => {
    const { layout } = stylesFor('light');

    expect(layout.action.minHeight).toBe(38);
    expect(layout.action).not.toHaveProperty('height');
  });

  // The header's trailing control would otherwise sit flush against the edge.
  it('insets the header\'s trailing control, at its own width', () => {
    const { headerEnd } = stylesFor('light').layout;

    expect(headerEnd.paddingEnd).toBe(8);
    expect(headerEnd.flexBasis).toBe('auto');
  });
});
