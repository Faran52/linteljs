import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { GATE } from '@config/linteljs';
import { STANDARD_PATHS } from '@config/standard';

import { initI18n } from '@i18n';
import { languages, resources } from '@i18n/config';

import { AboutPage } from './AboutPage';

const i18n = initI18n();
const last = languages.at(-1)?.id ?? 'en';

describe('AboutPage', () => {
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('lists every leg of the gate', () => {
    render(<AboutPage />);

    for (const { command } of GATE) {
      expect(screen.getByText(command)).toBeTruthy();
    }
  });

  it('names where the standard lives, so nothing has to be hunted for', () => {
    render(<AboutPage />);

    for (const { path } of STANDARD_PATHS) {
      expect(screen.getByText(path)).toBeTruthy();
    }
  });

  it('speaks the language chosen', async () => {
    render(<AboutPage />);

    await act(async () => {
      await i18n.changeLanguage(last);
    });

    const { common } = resources[last];
    const title = screen.getByRole('heading', { level: 1 }).textContent;

    expect(title).toBe(common.about);
    expect(screen.getByText(common.standardEslint)).toBeTruthy();
  });
});
