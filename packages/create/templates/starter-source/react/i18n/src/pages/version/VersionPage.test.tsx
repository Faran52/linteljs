import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { ANSWERS, STACK } from '@config/linteljs';

import { languages, resources } from '@i18n/config';
import { initI18n } from '@i18n/i18n';

import { VersionPage } from './VersionPage';

const i18n = initI18n();
const last = languages.at(-1)?.id ?? 'en';

describe('VersionPage', () => {
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('renders every recorded row of the stack', () => {
    render(<VersionPage />);

    for (const { name, version } of STACK) {
      const elements = screen.getAllByText(name);
      expect(elements).not.toHaveLength(0);
      const versionElements = screen.getAllByText(version);
      expect(versionElements).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from', () => {
    render(<VersionPage />);

    for (const { label } of ANSWERS) {
      const element = screen.getByText(label);
      expect(element).toBeTruthy();
    }
  });

  it('speaks the language chosen', async () => {
    render(<VersionPage />);

    await act(async () => {
      await i18n.changeLanguage(last);
    });

    const { common } = resources[last];
    const title = screen.getByRole('heading', { level: 1 }).textContent;

    expect(title).toBe(common.version);
    const element = screen.getByText(common.versionLede);
    expect(element).toBeTruthy();
  });
});
