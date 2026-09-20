import { render } from '@testing-library/react-native';

import { AnimatedIcon, AnimatedSplashOverlay } from './AnimatedIcon.web';

describe('AnimatedIcon (web)', () => {
  it('renders the logo and its glow', async () => {
    const view = await render(<AnimatedIcon />);

    expect(view.toJSON()).toBeTruthy();
  });
});

describe('AnimatedSplashOverlay (web)', () => {
  it('renders nothing, the web build having no splash screen to cover', async () => {
    const view = await render(<AnimatedSplashOverlay />);

    expect(view.toJSON()).toBeNull();
  });
});
