import { screen } from '@testing-library/react-native';
import { type ReactNode } from 'react';

import { renderScreen } from '@mocks/renderScreen';

import TabTwoScreen from './app/explore';

vi.mock('@/components/ExternalLink', async () => {
  const { Text } = await vi.importActual<typeof import('react-native')>('react-native');

  return { ExternalLink: ({ children }: { children?: ReactNode }) => <Text>{children}</Text> };
});

describe('TabTwoScreen', () => {
  it('renders its heading and the copy under it', async () => {
    await renderScreen(<TabTwoScreen />);

    expect(screen.getByText('Explore')).toBeTruthy();
  });

  it('points at the expo documentation', async () => {
    await renderScreen(<TabTwoScreen />);

    expect(screen.getByText('Expo documentation')).toBeTruthy();
  });
});
