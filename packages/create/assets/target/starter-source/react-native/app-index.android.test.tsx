import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import Home from './app/index';

vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  const platform = {
    OS: 'android',
    select: (options: Record<string, unknown>) => {
      return options['android'] ?? options['default'];
    },
  };

  return new Proxy(actual, {
    get: (target, key): unknown => {
      return key === 'Platform' ? platform : Reflect.get(target, key);
    },
  });
});

vi.mock('expo-device', () => {
  return { isDevice: false };
});

describe('Home (android simulator)', () => {
  it('gives the android keyboard shortcut', async () => {
    await renderScreen(<Home />);

    expect(screen.getByText('cmd+m (or ctrl+m)')).toBeTruthy();
  });
});
