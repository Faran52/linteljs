import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { CHECK } from '@config/linteljs';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';
import { initI18n } from '@i18n';
import { languages, resources } from '@i18n/config';

import { HomePage } from './HomePage';

const i18n = initI18n();
const last = languages.at(-1)?.id ?? 'en';

const renderPage = (): void => {
  render(
    <StoreProvider>
      <DataProvider>
        <HomePage name="my-app" />
      </DataProvider>
    </StoreProvider>,
  );
};

describe('HomePage', () => {
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('carries the project name as its heading', () => {
    renderPage();

    const element = screen.getByRole('heading', { name: 'my-app' });
    expect(element).toBeTruthy();
  });

  it('names the one command that runs the whole gate', () => {
    renderPage();

    const element = screen.getByText(CHECK);
    expect(element).toBeTruthy();
  });

  it('speaks the language chosen', async () => {
    renderPage();

    await act(async () => {
      await i18n.changeLanguage(last);
    });

    const { common } = resources[last];
    const element = screen.getByText(common.homeLedeReact);
    expect(element).toBeTruthy();
  });
});
