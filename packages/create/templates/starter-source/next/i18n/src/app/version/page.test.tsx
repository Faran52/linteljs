import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { ANSWERS, STACK } from '@config/linteljs';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import { chooseLanguage } from '@i18n/i18n';

import VersionPage from './page';

const last = languages.at(-1)?.id ?? 'en';

describe('the version route', () => {
  afterEach(() => {
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;
  });

  it('renders every recorded row of the stack', () => {
    render(<VersionPage />, { wrapper: I18nProvider });

    for (const { name, version } of STACK) {
      const elements = screen.getAllByText(name);
      expect(elements).not.toHaveLength(0);
      const versionElements = screen.getAllByText(version);
      expect(versionElements).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from', () => {
    render(<VersionPage />, { wrapper: I18nProvider });

    for (const { label } of ANSWERS) {
      const element = screen.getByText(label);
      expect(element).toBeTruthy();
    }
  });

  it('fills the file it was recorded in into its sentence, as code', () => {
    render(<VersionPage />, { wrapper: I18nProvider });

    const element = screen.getByText('linteljs.config.json', { selector: 'p > code' });
    expect(element).toBeTruthy();
  });

  it('speaks the language chosen', () => {
    render(<VersionPage />, { wrapper: I18nProvider });

    act(() => {
      chooseLanguage(last);
    });

    const { common } = resources[last];
    const title = screen.getByRole('heading', { level: 1 }).textContent;

    expect(title).toBe(common.version);
    const element = screen.getByText(common.versionLede);
    expect(element).toBeTruthy();
  });
});
