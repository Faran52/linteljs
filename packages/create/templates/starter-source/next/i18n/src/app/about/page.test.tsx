import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { CHECK, GATE } from '../../config/linteljs';
import { chooseLanguage } from '../../i18n';
import { languages, resources } from '../../i18n/config';
import { I18nProvider } from '../../lib/providers/i18n/I18nProvider';

import AboutPage from './page';

const last = languages.at(-1)?.id ?? 'en';

describe('the about route', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('lists every leg of the gate', () => {
    render(<AboutPage />, { wrapper: I18nProvider });

    expect(screen.getByRole('heading', { name: 'About' })).toBeTruthy();

    for (const { command } of GATE) {
      expect(screen.getAllByText(command)).not.toHaveLength(0);
    }
  });

  it('fills the command into its sentence, as code', () => {
    render(<AboutPage />, { wrapper: I18nProvider });

    expect(screen.getByText(CHECK, { selector: 'p > code' })).toBeTruthy();
  });

  it('speaks the language chosen', () => {
    render(<AboutPage />, { wrapper: I18nProvider });
    act(() => {
      chooseLanguage(last);
    });

    const { common } = resources[last];
    const title = screen.getByRole('heading', { level: 1 }).textContent;

    expect(title).toBe(common.about);
    expect(screen.getByText(common.standardEslint)).toBeTruthy();
  });
});
