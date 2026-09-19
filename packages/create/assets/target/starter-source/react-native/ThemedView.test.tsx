import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

import { ThemedView } from './ThemedView';

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

describe('ThemedView', () => {
  it('paints the background colour by default', async () => {
    await render(<ThemedView testID="view" />);

    expect(styleOf('view').backgroundColor).toBe(Colors.light.background);
  });

  it('paints the named role instead when one is given', async () => {
    await render(<ThemedView testID="view" type="backgroundElement" />);

    expect(styleOf('view').backgroundColor).toBe(Colors.light.backgroundElement);
  });

  it('keeps the caller style on top of its own', async () => {
    await render(<ThemedView testID="view" style={{ margin: 7 }} />);

    expect(styleOf('view').margin).toBe(7);
  });
});
