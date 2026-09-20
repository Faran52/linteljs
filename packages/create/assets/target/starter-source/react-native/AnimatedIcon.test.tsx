import { act, render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedIcon, AnimatedSplashOverlay } from './AnimatedIcon';

// Named because the standard this project is held to has no inline object types. `props` is an index signature of
// `any`, so the cast stays; only its shape gets a name.
interface LaidOutProps {
  onLayout: () => Promise<void>;
}

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

      const { onLayout } = root.props as LaidOutProps;

      await onLayout();
    });

    expect(SplashScreen.hideAsync).toHaveBeenCalled();
    expect(JSON.stringify(view.toJSON())).not.toBe(before);
  });
});
