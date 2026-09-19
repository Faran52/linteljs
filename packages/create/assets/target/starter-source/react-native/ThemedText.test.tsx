import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

import { ThemedText, type ThemedTextProps } from './ThemedText';

vi.mock('@/hooks/useTheme', async () => {
  const { Colors } = await vi.importActual<typeof import('@/constants/theme')>('@/constants/theme');

  return {
    useTheme: () => {
      return Colors.light;
    },
  };
});

const styleOf = (testID: string): Record<string, unknown> => {
  const { style } = screen.getByTestId(testID).props as { style: unknown };

  return StyleSheet.flatten(style) as Record<string, unknown>;
};

const TYPES: NonNullable<ThemedTextProps['type']>[] = [
  'default',
  'title',
  'small',
  'smallBold',
  'subtitle',
  'link',
  'linkPrimary',
  'code',
];

describe('ThemedText', () => {
  it.each(TYPES)('gives the %s variant a font size of its own, each being its own style branch', async (type) => {
    await render(<ThemedText testID="text" type={type}>body</ThemedText>);

    expect(styleOf('text').fontSize).toBeGreaterThan(0);
  });

  it('reads the text colour from the theme when no role is named', async () => {
    await render(<ThemedText testID="text">body</ThemedText>);

    expect(styleOf('text').color).toBe(Colors.light.text);
  });

  it('reads the named role instead when one is given', async () => {
    await render(<ThemedText testID="text" themeColor="textSecondary">body</ThemedText>);

    expect(styleOf('text').color).toBe(Colors.light.textSecondary);
  });
});
