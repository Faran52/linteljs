import { renderScreen } from '@mocks/renderScreen';
import { screen } from '@testing-library/react-native';

import HomeScreen from '@/app/index';
import { NAME } from '@/config/linteljs';

/*
 * Beside `src/app/`, not inside it: expo-router treats every file under the route root as a route, and measured,
 * `expo export` died on `expect is not defined` when a suite sat there.
 */
describe('the home screen', () => {
  it('carries the project name and the mark', async () => {
    await renderScreen(<HomeScreen />);

    expect(screen.getByText(NAME)).toBeTruthy();
    expect(screen.getByLabelText('linteljs')).toBeTruthy();
  });

  it('names the one command that runs the whole gate', async () => {
    await renderScreen(<HomeScreen />);

    expect(screen.getByText(/pnpm check/)).toBeTruthy();
  });
});
