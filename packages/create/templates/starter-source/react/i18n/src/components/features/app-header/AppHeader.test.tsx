import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { initI18n } from '@i18n';
import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';

import { AppHeader } from './AppHeader';

const chosen: string[] = [];
const i18n = initI18n();
const last = languages.at(-1)?.id ?? 'en';

const onNavigate = (page: string): void => {
  chosen.push(page);
};

const renderHeader = (): void => {
  render(
    <AppHeader
      name="my-app"
      current="home"
      onNavigate={onNavigate}
    />,
  );
};

describe('AppHeader', () => {
  beforeEach(() => {
    chosen.length = 0;
  });

  afterEach(async () => {
    localStorage.clear();

    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('names the project and every page', () => {
    renderHeader();

    expect(screen.getByText('LintelJS Starter')).toBeTruthy();
    expect(screen.getByText('my-app')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'About' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Version' })).toBeTruthy();
  });

  it('marks the current page for a screen reader', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'About' }).getAttribute('aria-current')).toBeNull();
  });

  it('answers with the page that was chosen', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Version' }));

    expect(chosen).toEqual(['version']);
  });

  it('switches the language, and stores the choice', async () => {
    renderHeader();

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: last } });
      await i18n.changeLanguage(last);
    });

    const home = resources[last].common.home;

    expect(localStorage.getItem(languageStorageKey)).toBe(last);
    expect(screen.getByRole('button', { name: home })).toBeTruthy();
  });
});
