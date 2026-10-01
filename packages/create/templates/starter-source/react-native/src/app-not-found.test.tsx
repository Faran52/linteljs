import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import NotFoundScreen from '@/app/+not-found';
import { STATUSES } from '@/config/statuses';

// expo-router's entry reaches Expo's TypeScript source, which no test transform strips; a text stands in.
vi.mock('expo-router', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  return { Link: Text };
});

describe('the not-found screen', () => {
  it('answers a path no route matches with the 404 page', async () => {
    await renderScreen(<NotFoundScreen />);

    expect(screen.getByText('404')).toBeTruthy();
    expect(screen.getByText(STATUSES.notFound.message)).toBeTruthy();
  });
});
