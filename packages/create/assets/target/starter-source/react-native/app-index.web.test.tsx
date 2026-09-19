import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import Home from './app/index';

vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  const platform = {
    OS: 'web',
    select: (options: Record<string, unknown>) => {
      return options['web'] ?? options['default'];
    },
  };

  return new Proxy(actual, {
    get: (target, key): unknown => {
      return key === 'Platform' ? platform : Reflect.get(target, key);
    },
  });
});

describe('Home (web)', () => {
  it('points at the browser devtools rather than a device gesture', async () => {
    await renderScreen(<Home />);

    expect(screen.getByText('use browser devtools')).toBeTruthy();
  });
});
