import { renderScreen } from '@mocks/renderScreen';
import { screen } from '@testing-library/react-native';

import AboutScreen from '@/app/about';
import { GATE } from '@/config/linteljs';

describe('the about screen', () => {
  it('lists every leg of the gate', async () => {
    await renderScreen(<AboutScreen />);

    for (const { command } of GATE) {
      expect(screen.getByText(command)).toBeTruthy();
    }
  });

  it('says where the standard lives', async () => {
    await renderScreen(<AboutScreen />);

    expect(screen.getByText('eslint.config.js')).toBeTruthy();
  });
});
