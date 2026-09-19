import type { PressableProps, PressableStateCallbackType } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import AppTabs, { CustomTabList, TabButton } from './AppTabs.web';

const { mockScheme } = vi.hoisted(() => {
  return { mockScheme: vi.fn(() => 'light') };
});

vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');

  const held: PressableStateCallbackType = { pressed: true, hovered: false };
  const Pressable = (props: PressableProps) => {
    if (typeof props.style === 'function') {
      props.style(held);
    }

    return <actual.Pressable {...props} />;
  };

  return new Proxy(actual, {
    get: (target, key): unknown => {
      if (key === 'useColorScheme') {
        return mockScheme;
      }

      return key === 'Pressable' ? Pressable : Reflect.get(target, key);
    },
  });
});

vi.mock('expo-router/ui', async () => {
  const { View } = await vi.importActual<typeof import('react-native')>('react-native');
  const passthrough = ({ children }: { children?: React.ReactNode }) => {
    return <View>{children}</View>;
  };

  return {
    Tabs: passthrough,
    TabList: passthrough,
    TabTrigger: passthrough,
    TabSlot: () => {
      return <View />;
    },
  };
});

vi.mock('./ExternalLink', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  return { ExternalLink: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text> };
});

describe('AppTabs (web)', () => {
  it('names both tabs', async () => {
    await render(<AppTabs />);

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Explore')).toBeTruthy();
  });
});

describe('CustomTabList', () => {
  it('falls back to light when the system expresses no preference', async () => {
    mockScheme.mockReturnValue('unspecified');

    const view = await render(<CustomTabList />);

    expect(view.toJSON()).toBeTruthy();
  });

  it('reads the dark palette when the system is dark', async () => {
    mockScheme.mockReturnValue('dark');

    const view = await render(<CustomTabList />);

    expect(view.toJSON()).toBeTruthy();
  });
});

describe('TabButton press state', () => {
  it('evaluates its style callback while held', async () => {
    const view = await render(<TabButton isFocused testOnly_pressed>Home</TabButton>);

    expect(view.toJSON()).toBeTruthy();
  });
});

describe('TabButton', () => {
  it('marks the focused tab differently from the rest', async () => {
    const focused = await render(<TabButton isFocused>Home</TabButton>);
    const focusedTree = JSON.stringify(focused.toJSON());

    await focused.unmount();

    const resting = await render(<TabButton isFocused={false}>Home</TabButton>);

    expect(JSON.stringify(resting.toJSON())).not.toBe(focusedTree);
  });
});
