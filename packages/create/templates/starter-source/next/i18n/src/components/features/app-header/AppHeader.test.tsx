import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { pathnameMock } from '@mocks/setupTests';

import { PAGES } from '../../../config/routes';
import {
  languages,
  languageStorageKey,
  resources,
} from '../../../i18n/config';
import { I18nProvider } from '../../../lib/providers/i18n/I18nProvider';

import { AppHeader } from './AppHeader';

const last = languages.at(-1)?.id ?? 'en';

describe('AppHeader', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('names the project and links every page the route list names', () => {
    render(<AppHeader name="my-app" />, { wrapper: I18nProvider });

    expect(screen.getByText('LintelJS Starter')).toBeTruthy();
    expect(screen.getByText('my-app')).toBeTruthy();

    for (const { label } of PAGES) {
      expect(screen.getByRole('link', { name: label })).toBeTruthy();
    }
  });

  it('marks the page it is on for a screen reader', () => {
    pathnameMock.mockReturnValue('/about');
    render(<AppHeader name="my-app" />, { wrapper: I18nProvider });

    expect(screen.getByRole('link', { name: 'About' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
  });

  it('switches the language, and stores the choice', () => {
    render(<AppHeader name="my-app" />, { wrapper: I18nProvider });
    act(() => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: last } });
    });

    const { common } = resources[last];

    expect(localStorage.getItem(languageStorageKey)).toBe(last);
    expect(screen.getByRole('link', { name: common.home })).toBeTruthy();
    expect(screen.getByText(common.starterLabel)).toBeTruthy();
  });
});
