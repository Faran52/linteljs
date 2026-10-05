import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import { CHECK, NAME } from '@/config/linteljs';

import HomeScreen from './app/(tabs)/index';

describe('the home screen', () => {
  it('carries the project name and the mark', async () => {
    await renderScreen(<HomeScreen />);

    const element = screen.getByText(NAME);
    expect(element).toBeTruthy();
    const linteljsElement = screen.getByLabelText('linteljs');
    expect(linteljsElement).toBeTruthy();
  });

  it('names the one command that runs the whole gate', async () => {
    await renderScreen(<HomeScreen />);

    const hint = `Run ${CHECK} for the full gate.`;

    const element = screen.getByText(hint);
    expect(element).toBeTruthy();
  });

  it('is the one main landmark on the page', async () => {
    await renderScreen(<HomeScreen />);

    const landmarks = screen.container.queryAll((node) => {
      return node.props.role === 'main';
    });
    expect(landmarks).toHaveLength(1);
  });
});
