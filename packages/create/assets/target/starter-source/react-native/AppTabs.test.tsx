import { render, screen } from '@testing-library/react-native';
import { type ReactNode } from 'react';

import { Colors } from '@/constants/theme';

import AppTabs from './AppTabs';

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

vi.mock('expo-router/unstable-native-tabs', async () => {
  const { View, Text } = await vi.importActual<typeof import('react-native')>('react-native');
  const NativeTabs = ({ children, ...rest }: { children?: ReactNode }) => {
    return <View testID="native-tabs" {...rest}>{children}</View>;
  };

  NativeTabs.Trigger = Object.assign(
    ({ children }: { children?: ReactNode }) => {
      return <View>{children}</View>;
    },
    {
      Label: ({ children }: { children?: ReactNode }) => {
        return <Text>{children}</Text>;
      },
      Icon: () => {
        return <View />;
      },
    },
  );

  return { NativeTabs };
});

describe('AppTabs', () => {
  it('names both tabs', async () => {
    mockScheme.mockReturnValue('light');

    await render(<AppTabs />);

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Explore')).toBeTruthy();
  });

  it('takes its colours from the scheme the system reports', async () => {
    mockScheme.mockReturnValue('dark');

    await render(<AppTabs />);

    expect(screen.getByTestId('native-tabs').props.backgroundColor).toBe(Colors.dark.background);
  });

  it('falls back to light when the system reports unspecified, which no palette has a key for', async () => {
    mockScheme.mockReturnValue('unspecified');

    await render(<AppTabs />);

    expect(screen.getByTestId('native-tabs').props.backgroundColor).toBe(Colors.light.background);
  });
});
