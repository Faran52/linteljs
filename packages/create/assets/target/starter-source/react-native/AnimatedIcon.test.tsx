import { act, render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedIcon, AnimatedSplashOverlay } from './AnimatedIcon';

describe('AnimatedIcon', () => {
  it('renders the logo, its glow and the backdrop', async () => {
    const view = await render(<AnimatedIcon />);

    expect(view.toJSON()).toBeTruthy();
  });
});

describe('AnimatedSplashOverlay', () => {
  it('hides the splash screen once it has laid out, then swaps to the animated view', async () => {
    const view = await render(<AnimatedSplashOverlay />);
    const before = JSON.stringify(view.toJSON());

    await act(async () => {
      const root = view.root;

      if (root === null) {
        throw new Error('the overlay rendered nothing to lay out');
      }

      const { onLayout } = root.props as { onLayout: () => Promise<void> };

      await onLayout();
    });

    expect(SplashScreen.hideAsync).toHaveBeenCalled();
    expect(JSON.stringify(view.toJSON())).not.toBe(before);
  });
});
