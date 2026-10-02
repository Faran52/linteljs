import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { PAGES } from '@config/routes';

import { I18nProvider } from '@lib/providers/i18n/I18nProvider';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';

import { pathnameMock } from '@mocks/setupTests';

import { AppHeader } from './AppHeader';

const last = languages.at(-1)?.id ?? 'en';

describe('AppHeader', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('names the project and links every page the route list names', () => {
    render(<AppHeader name="my-app" />, { wrapper: I18nProvider });

    const element = screen.getByText('LintelJS Starter');
    expect(element).toBeTruthy();
    const myAppElement = screen.getByText('my-app');
    expect(myAppElement).toBeTruthy();

    for (const { label } of PAGES) {
      const element = screen.getByRole('link', { name: label });
      expect(element).toBeTruthy();
    }
  });

  it('marks the page it is on for a screen reader', () => {
    pathnameMock.mockReturnValue('/about');
    render(<AppHeader name="my-app" />, { wrapper: I18nProvider });

    const attribute = screen.getByRole('link', { name: 'About' }).getAttribute('aria-current');
    expect(attribute).toBe('page');
    const ariaCurrentAttribute = screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current');
    expect(ariaCurrentAttribute).toBeNull();
  });

  it('switches the language, and stores the choice', () => {
    render(<AppHeader name="my-app" />, { wrapper: I18nProvider });

    act(() => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: last } });
    });

    const { common } = resources[last];

    const item = localStorage.getItem(languageStorageKey);
    expect(item).toBe(last);
    const element = screen.getByRole('link', { name: common.home });
    expect(element).toBeTruthy();
    const element2 = screen.getByText(common.starterLabel);
    expect(element2).toBeTruthy();
  });
});
