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

// The build's React Compiler skips a child whose props never change, and it is off under Vitest: this does the same.
vi.mock('react-i18next', async () => {
  const { memo } = await vi.importActual<typeof import('react')>('react');
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  const reactI18next = { ...actual, Trans: memo(actual.Trans) };

  return reactI18next;
});

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

  it('speaks the chosen language in the gate hint', async () => {
    renderPage();

    await act(async () => {
      await i18n.changeLanguage(last);
    });

    const { common } = resources[last];
    const hint = common.gateHint
      .replace('<code>{command}</code>', CHECK);
    const text = screen.getByText(CHECK)
      .closest('p')?.textContent;
    expect(text).toBe(hint);
  });
});
