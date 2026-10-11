import { Platform } from 'react-native';

import { render } from '@testing-library/react-native';
import Head from 'expo-router/head';

import { DocumentHead } from './DocumentHead';

jest.mock('expo-router/head', () => {
  const head = jest.fn((): null => {
    return null;
  });
  const expoHead = { __esModule: true, default: head };

  return expoHead;
});

describe('DocumentHead', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('leaves the head out of a native build', async () => {
    await render(<DocumentHead />);

    const head = jest.mocked(Head);
    expect(head).not.toHaveBeenCalled();
  });

  it('writes the head on the web', async () => {
    const os = jest.replaceProperty(Platform, 'OS', 'web');
    await render(<DocumentHead />);
    os.restore();

    const head = jest.mocked(Head);
    expect(head).toHaveBeenCalledTimes(1);
  });
});
