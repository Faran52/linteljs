import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { CHECK, GATE } from '@config/linteljs';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import { chooseLanguage } from '@i18n/i18n';

import AboutPage from './page';

const last = languages.at(-1)?.id ?? 'en';

describe('the about route', () => {
  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
  });

  it('lists every leg of the gate', () => {
    render(<AboutPage />, { wrapper: I18nProvider });

    const element = screen.getByRole('heading', { name: 'About' });
    expect(element).toBeTruthy();

    for (const { command } of GATE) {
      const elements = screen.getAllByText(command);
      expect(elements).not.toHaveLength(0);
    }
  });

  it('fills the command into its sentence, as code', () => {
    render(<AboutPage />, { wrapper: I18nProvider });

    const element = screen.getByText(CHECK, { selector: 'p > code' });
    expect(element).toBeTruthy();
  });

  it('speaks the language chosen', () => {
    render(<AboutPage />, { wrapper: I18nProvider });

    act(() => {
      chooseLanguage(last);
    });

    const { common } = resources[last];
    const title = screen.getByRole('heading', { level: 1 }).textContent;

    expect(title).toBe(common.about);
    const element = screen.getByText(common.standardEslint);
    expect(element).toBeTruthy();
  });
});
