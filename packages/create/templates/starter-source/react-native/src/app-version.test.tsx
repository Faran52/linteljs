import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import { ANSWERS, STACK } from '@/config/linteljs';

import VersionScreen from './app/version';

describe('the version screen', () => {
  it('renders every recorded row of the stack', async () => {
    await renderScreen(<VersionScreen />);

    for (const { name } of STACK) {
      const elements = screen.getAllByText(name);
      expect(elements).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from', async () => {
    await renderScreen(<VersionScreen />);

    for (const { label } of ANSWERS) {
      const elements = screen.getAllByText(label);
      expect(elements).not.toHaveLength(0);
    }
  });

  it('is the one main landmark on the page', async () => {
    await renderScreen(<VersionScreen />);

    const landmarks = screen.container.queryAll((node) => {
      return node.props.role === 'main';
    });
    expect(landmarks).toHaveLength(1);
  });
});
