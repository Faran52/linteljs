import { screen } from '@testing-library/react-native';

import { renderScreen } from '@mocks/renderScreen';

import Home from './app/index';

const { device } = vi.hoisted(() => {
  return { device: { isDevice: true } };
});

vi.mock('expo-device', () => {
  return {
    get isDevice() {
      return device.isDevice;
    },
  };
});

describe('Home', () => {
  it('renders its heading', async () => {
    await renderScreen(<Home />);

    expect(screen.getByText('Welcome to Expo')).toBeTruthy();
  });

  it('names the three things a new project does first', async () => {
    await renderScreen(<Home />);

    expect(screen.getByText('Try editing')).toBeTruthy();
    expect(screen.getByText('Dev tools')).toBeTruthy();
    expect(screen.getByText('Fresh start')).toBeTruthy();
  });

  it('tells a real device to shake it', async () => {
    device.isDevice = true;

    await renderScreen(<Home />);

    expect(screen.getByText(/shake device/)).toBeTruthy();
  });

  it('gives a simulator the keyboard shortcut instead', async () => {
    device.isDevice = false;

    await renderScreen(<Home />);

    expect(screen.getByText(/press/)).toBeTruthy();
  });
});
