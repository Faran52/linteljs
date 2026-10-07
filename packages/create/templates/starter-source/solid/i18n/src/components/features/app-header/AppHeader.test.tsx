import {
  fireEvent,
  render,
  screen,
} from '@solidjs/testing-library';

import { applyLanguage } from '@i18n';
import { languages, resources } from '@i18n/config';

import { ROUTES } from '@router/router';

import { AppHeader } from './AppHeader';
import { styles } from './appHeaderStyles';

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

    const element = screen.getByText(common.starterLabel);
    expect(element).toBeTruthy();

    expect(labels).toEqual(expect.arrayContaining([
      common.home,
      common.about,
      common.version,
    ]));

    expect(labels).toHaveLength(ROUTES.length);
  });

  it('marks the page it is on, and reports the page clicked', () => {
    const visited: string[] = [];

    render(() => {
      return (
        <AppHeader
          name="app"
          current="about"
          onNavigate={(page) => {
            visited.push(page);
          }}
        />
      );
    });

    const { common } = resources.en;
    const current = screen.getByRole('button', { current: 'page' });
    const other = screen.getByRole('button', { name: common.version });

    fireEvent.click(other);

    expect(current.textContent).toBe(common.about);
    const attribute = current.getAttribute('class');
    expect(attribute).toBe(styles.tab(true).class);
    const classAttribute = other.getAttribute('class');
    expect(classAttribute).toBe(styles.tab(false).class);
    const expected = ['version'];
    expect(visited).toEqual(expected);
  });

  it('holds the language select, styled as a tab', () => {
    open();

    const select = screen.getByRole('combobox', { name: 'Language' });

    const attribute = select.getAttribute('class');
    expect(attribute).toBe(styles.tab(false).class);
  });
});
