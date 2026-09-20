import { type ReactNode } from 'react';

import { render, screen } from '@testing-library/react-native';

import TabLayout from './app/_layout';

// Named because the standard this project is held to has no inline object types, mock components included.
interface ThemeValue {
  dark: boolean;
}

interface ThemeProviderProps {
  children?: ReactNode;
  value: ThemeValue;
}

const { mockScheme } = vi.hoisted(() => {
  return { mockScheme: vi.fn() };
});

vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');

  return new Proxy(actual, {
    get: (target, key): unknown => {
      return key === 'useColorScheme' ? mockScheme : Reflect.get(target, key);
    },
  });
});

vi.mock('expo-router', async () => {
  const { View } = await vi.importActual<typeof import('react-native')>('react-native');

  return {
    DarkTheme: { dark: true },
    DefaultTheme: { dark: false },
    ThemeProvider: ({ children, value }: ThemeProviderProps) => {
      return <View testID="theme" accessibilityLabel={value.dark ? 'dark' : 'light'}>{children}</View>;
    },
  };
});

vi.mock('@/components/AppTabs', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  return {
    __esModule: true,
    default: () => {
      return <Text>tabs</Text>;
    },
  };
});

vi.mock('@/components/AnimatedIcon', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  return {
    AnimatedSplashOverlay: () => {
      return <Text>splash</Text>;
    },
  };
});

describe('TabLayout', () => {
  it('mounts the splash overlay above the tabs', async () => {
    mockScheme.mockReturnValue('light');

    await render(<TabLayout />);

    expect(screen.getByText('splash')).toBeTruthy();
    expect(screen.getByText('tabs')).toBeTruthy();
  });

  it('hands the router the theme matching the system scheme', async () => {
    mockScheme.mockReturnValue('dark');

    await render(<TabLayout />);

    expect(screen.getByTestId('theme').props.accessibilityLabel).toBe('dark');
  });

  it('falls back to the default theme when the system is not dark', async () => {
    mockScheme.mockReturnValue('light');

    await render(<TabLayout />);

    expect(screen.getByTestId('theme').props.accessibilityLabel).toBe('light');
  });
});
