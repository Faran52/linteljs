import { useReducedMotion } from 'react-native-reanimated';

import { renderScreen } from '@mocks/renderScreen';
import { screen } from '@testing-library/react-native';

import { Mark } from './Mark';

describe('Mark', () => {
  it('renders as a single labelled image', async () => {
    await renderScreen(<Mark />);

    expect(screen.getByLabelText('linteljs')).toBeTruthy();
  });

  it('drifts its lines on a loop', async () => {
    await renderScreen(<Mark />);

    const tree = JSON.stringify(screen.toJSON());

    expect(tree).toContain('"animationIterationCount":"infinite"');
  });

  it('holds still when the reader asks for reduced motion', async () => {
    vi.mocked(useReducedMotion).mockReturnValueOnce(true);

    await renderScreen(<Mark />);

    const tree = JSON.stringify(screen.toJSON());

    expect(tree).not.toContain('animationName');
  });
});
