import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import {
  languages,
  languageStorageKey,
  resources,
} from '@i18n/config';
import { initI18n } from '@i18n/i18n';
import { storedLanguage } from '@i18n/utils/cookieUtils';

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
    document.cookie = `${languageStorageKey}=; max-age=-1; path=/`;

    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('names the project and every page', () => {
    renderHeader();

    const element = screen.getByText('LintelJS Starter');
    expect(element).toBeTruthy();
    const myAppElement = screen.getByText('my-app');
    expect(myAppElement).toBeTruthy();
    const buttonElement = screen.getByRole('button', { name: 'Home' });
    expect(buttonElement).toBeTruthy();
    const element2 = screen.getByRole('button', { name: 'About' });
    expect(element2).toBeTruthy();
    const element3 = screen.getByRole('button', { name: 'Version' });
    expect(element3).toBeTruthy();
  });

  it('marks the current page for a screen reader', () => {
    renderHeader();

    const attribute = screen.getByRole('button', { name: 'Home' }).getAttribute('aria-current');
    expect(attribute).toBe('page');
    const ariaCurrentAttribute = screen.getByRole('button', { name: 'About' }).getAttribute('aria-current');
    expect(ariaCurrentAttribute).toBeNull();
  });

  it('answers with the page that was chosen', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Version' }));

    const expected = ['version'];
    expect(chosen).toEqual(expected);
  });

  it('switches the language, and stores the choice', async () => {
    renderHeader();

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: last } });
      await i18n.changeLanguage(last);
    });

    const { home } = resources[last].common;

    const item = storedLanguage(document.cookie);
    expect(item).toBe(last);
    const element = screen.getByRole('button', { name: home });
    expect(element).toBeTruthy();
  });
});
