import { renderScreen } from '@mocks/renderScreen';
import { screen } from '@testing-library/react-native';

import { Mark } from './Mark';

describe('Mark', () => {
  // Four views rather than an SVG, and static: what a suite can assert is that it is one labelled image.
  it('renders as a single labelled image', async () => {
    await renderScreen(<Mark />);

    expect(screen.getByLabelText('linteljs')).toBeTruthy();
  });
});
