import { renderScreen } from '@mocks/renderScreen';
import { screen } from '@testing-library/react-native';

import TabTwoScreen from './app/explore';

import type { PressableProps, PressableStateCallbackType } from 'react-native';

// Named because the standard this project is held to has no inline object types, mock components included.
interface ChildrenProps {
  children?: ReactNode;
}

vi.mock('@/components/ExternalLink', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  return {
    ExternalLink: ({ children }: ChildrenProps) => {
      return <Text>{children}</Text>;
    },
  };
});

vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  const platform = {
    OS: 'web',
    select: (options: Record<string, unknown>) => {
      return options['web'] ?? options['default'];
    },
  };

  const held: PressableStateCallbackType = {
    pressed: true,
    hovered: false,
  };
  const Pressable = (props: PressableProps) => {
    if (typeof props.style === 'function') {
      props.style(held);
    }

    return <actual.Pressable {...props} />;
  };

  return new Proxy(actual, {
    get: (target, key): unknown => {
      if (key === 'Platform') {
        return platform;
      }

      return key === 'Pressable' ? Pressable : Reflect.get(target, key);
    },
  });
});

describe('TabTwoScreen (web)', () => {
  it('shows the expo version badge, which only web carries', async () => {
    await renderScreen(<TabTwoScreen />);

    expect(screen.getByText('Explore')).toBeTruthy();
  });
});
