import type { PressableProps, PressableStateCallbackType } from 'react-native';

import {
  render,
  screen,
  userEvent,
} from '@testing-library/react-native';

import { ThemedText } from '@/components/ThemedText';

import { Collapsible } from './Collapsible';

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
      return key === 'Pressable' ? Pressable : Reflect.get(target, key);
    },
  });
});

vi.mock('@/hooks/useTheme', async () => {
  const { Colors } = await vi.importActual<typeof import('@/constants/theme')>('@/constants/theme');

  return {
    useTheme: () => {
      return Colors.light;
    },
  };
});

describe('Collapsible', () => {
  it('shows its title and hides its children until it is opened', async () => {
    await render(
      <Collapsible title="Details">
        <ThemedText>the body</ThemedText>
      </Collapsible>,
    );

    expect(screen.getByText('Details')).toBeTruthy();
    expect(screen.queryByText('the body')).toBeNull();
  });

  it('reveals the children on press and hides them again on a second press', async () => {
    const user = userEvent.setup();

    await render(
      <Collapsible title="Details">
        <ThemedText>the body</ThemedText>
      </Collapsible>,
    );

    await user.press(screen.getByText('Details'));

    expect(screen.getByText('the body')).toBeTruthy();

    await user.press(screen.getByText('Details'));

    expect(screen.queryByText('the body')).toBeNull();
  });
});
