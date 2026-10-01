import { chooseLanguage } from '@i18n';
import { languages, resources } from '@i18n/config';
import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { ANSWERS, STACK } from '@config/linteljs';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';

import VersionPage from './page';

const last = languages.at(-1)?.id ?? 'en';

describe('the version route', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('renders every recorded row of the stack', () => {
    render(<VersionPage />, { wrapper: I18nProvider });

    for (const { name, version } of STACK) {
      expect(screen.getAllByText(name)).not.toHaveLength(0);
      expect(screen.getAllByText(version)).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from', () => {
    render(<VersionPage />, { wrapper: I18nProvider });

    for (const { label } of ANSWERS) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('fills the file it was recorded in into its sentence, as code', () => {
    render(<VersionPage />, { wrapper: I18nProvider });

    expect(screen.getByText('linteljs.config.json', { selector: 'p > code' })).toBeTruthy();
  });

  it('speaks the language chosen', () => {
    render(<VersionPage />, { wrapper: I18nProvider });
    act(() => {
      chooseLanguage(last);
    });

    const { common } = resources[last];
    const title = screen.getByRole('heading', { level: 1 }).textContent;

    expect(title).toBe(common.version);
    expect(screen.getByText(common.versionLede)).toBeTruthy();
  });
});
