import { renderScreen } from '@mocks/renderScreen';
import { screen } from '@testing-library/react-native';

import { Mark } from './Mark';

describe('Mark', () => {
  it('renders as a single labelled image', async () => {
    await renderScreen(<Mark />);

    expect(screen.getByLabelText('linteljs')).toBeTruthy();
  });
});
