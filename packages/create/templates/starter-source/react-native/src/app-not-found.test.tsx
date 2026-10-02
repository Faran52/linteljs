import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import { STATUSES } from '@/config/statuses';

import NotFoundScreen from './app/+not-found';

// expo-router's entry reaches Expo's TypeScript source, which no test transform strips; a text stands in.
vi.mock('expo-router', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  const expoRouter = { Link: Text };

  return expoRouter;
});

describe('the not-found screen', () => {
  it('answers a path no route matches with the 404 page', async () => {
    await renderScreen(<NotFoundScreen />);

    const element = screen.getByText('404');
    expect(element).toBeTruthy();
    const element2 = screen.getByText(STATUSES.notFound.message);
    expect(element2).toBeTruthy();
  });
});
