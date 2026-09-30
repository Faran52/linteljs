import {
  act,
  render,
  screen,
} from '@testing-library/react';

import { ANSWERS, STACK } from '../../config/linteljs';
import { initI18n } from '../../i18n';
import { languages, resources } from '../../i18n/config';

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
      expect(screen.getAllByText(name)).not.toHaveLength(0);
      expect(screen.getAllByText(version)).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from', () => {
    render(<VersionPage />);

    for (const { label } of ANSWERS) {
      expect(screen.getByText(label)).toBeTruthy();
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
    expect(screen.getByText(common.versionLede)).toBeTruthy();
  });
});
