import { render, screen } from '@solidjs/testing-library';

import { applyLanguage } from '../../../i18n';
import { languages, resources } from '../../../i18n/config';
import { ROUTES } from '../../../pages/routes';

import { AppHeader } from './AppHeader';

const last = languages.at(-1)?.id ?? 'en';

const open = (): void => {
  render(() => {
    return (
      <AppHeader
        name="app"
        current="home"
        onNavigate={() => {
          return undefined;
        }}
      />
    );
  });
};

describe('AppHeader', () => {
  afterEach(() => {
    applyLanguage('en');
  });

  it('names each page in the language applied, and follows a switch', () => {
    open();
    applyLanguage(last);

    const { common } = resources[last];
    const labels = screen.getAllByRole('button')
      .map((tab) => {
        return tab.textContent;
      });

    expect(screen.getByText(common.starterLabel)).toBeTruthy();
    expect(labels).toEqual(expect.arrayContaining([
      common.home,
      common.about,
      common.version,
    ]));
    expect(labels).toHaveLength(ROUTES.length);
  });

  it('holds the language select', () => {
    open();

    expect(screen.getByRole('combobox', { name: 'Language' })).toBeTruthy();
  });
});
