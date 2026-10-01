import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import { CHECK, NAME } from '@/config/linteljs';

import HomeScreen from './app/index';

describe('the home screen', () => {
  it('carries the project name and the mark', async () => {
    await renderScreen(<HomeScreen />);

    expect(screen.getByText(NAME)).toBeTruthy();
    expect(screen.getByLabelText('linteljs')).toBeTruthy();
  });

  it('names the one command that runs the whole gate', async () => {
    await renderScreen(<HomeScreen />);

    const hint = `Run ${CHECK} for the full gate.`;

    expect(screen.getByText(hint)).toBeTruthy();
  });
});
