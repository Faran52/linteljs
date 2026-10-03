import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { CHECK } from '@config/linteljs';

import { StoreProvider } from '@lib/providers/store/StoreProvider';
import { applyLanguage } from '@i18n';
import { languages, resources } from '@i18n/config';

import { HomePage } from './HomePage';

const last = languages.at(-1)?.id ?? 'en';

describe('HomePage', () => {
  const open = (): void => {
    render(() => {
      return (
        <StoreProvider>
          <HomePage name="my-app" />
        </StoreProvider>
      );
    });
  };

  afterEach(() => {
    applyLanguage('en');
  });

  it('carries the project name as its heading', () => {
    open();

    const element = screen.getByRole('heading', { name: 'my-app' });
    expect(element).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    open();

    const element = screen.getByText(CHECK);
    expect(element).toBeTruthy();
  });

  it('counts up when the button it holds is pressed', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const element = screen.getByText('1');
    expect(element).toBeTruthy();
  });

  it('speaks the language chosen', () => {
    open();
    applyLanguage(last);

    const { common } = resources[last];
    const element = screen.getByText(common.homeLedeSolid);
    expect(element).toBeTruthy();
  });
});
