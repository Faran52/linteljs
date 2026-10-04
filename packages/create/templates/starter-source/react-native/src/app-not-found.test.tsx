import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import { STATUSES } from '@/config/statuses';

import NotFoundScreen from './app/+not-found';

describe('the not-found screen', () => {
  it('answers a path no route matches with the 404 page', async () => {
    await renderScreen(<NotFoundScreen />);

    const element = screen.getByText('404');
    expect(element).toBeTruthy();
    const element2 = screen.getByText(STATUSES.notFound.message);
    expect(element2).toBeTruthy();
  });
});
