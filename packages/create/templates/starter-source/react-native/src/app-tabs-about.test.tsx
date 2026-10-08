import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import { GATE } from '@/config/linteljs';

import AboutScreen from './app/(tabs)/about';

describe('the about screen', () => {
  it('lists every leg of the gate', async () => {
    await renderScreen(<AboutScreen />);

    for (const { command } of GATE) {
      const element = screen.getByText(command);
      expect(element).toBeTruthy();
    }
  });

  it('says where the standard lives', async () => {
    await renderScreen(<AboutScreen />);

    const element = screen.getByText('eslint.config.ts');
    expect(element).toBeTruthy();
  });

  it('is the one main landmark on the page, and a keyboard can reach its scroll', async () => {
    await renderScreen(<AboutScreen />);

    const landmarks = screen.container.queryAll((node) => {
      return node.props.role === 'main';
    });
    expect(landmarks).toHaveLength(1);
    expect(landmarks[0]).toHaveProp('tabIndex', 0);
    // iOS offsets a padded scroll view's content in RTL, so the padding sits on its content.
    expect(landmarks[0]).not.toHaveStyle({ paddingHorizontal: 24 });
  });
});
