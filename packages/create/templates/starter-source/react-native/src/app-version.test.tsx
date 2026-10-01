import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import VersionScreen from '@/app/version';
import { ANSWERS, STACK } from '@/config/linteljs';

describe('the version screen', () => {
  it('renders every recorded row of the stack', async () => {
    await renderScreen(<VersionScreen />);

    for (const { name } of STACK) {
      expect(screen.getAllByText(name)).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from', async () => {
    await renderScreen(<VersionScreen />);

    for (const { label } of ANSWERS) {
      expect(screen.getAllByText(label)).not.toHaveLength(0);
    }
  });
});
