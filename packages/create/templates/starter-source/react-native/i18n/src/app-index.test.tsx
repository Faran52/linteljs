import { act, screen } from '@testing-library/react-native';
import i18next from 'i18next';

import { renderScreen } from '@mocks/renderScreen';

import { CHECK, NAME } from '@/config/linteljs';
import { languages, resources } from '@/i18n/config';

import HomeScreen from './app/index';

// The build's React Compiler skips a child whose props never change, and it is off under Vitest: this does the same.
vi.mock('react-i18next', async () => {
  const { memo } = await vi.importActual<typeof import('react')>('react');
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  const reactI18next = { ...actual, Trans: memo(actual.Trans) };

  return reactI18next;
});

const last = languages.at(-1)?.id ?? 'en';

describe('the home screen', () => {
  afterEach(async () => {
    await act(async () => {
      await i18next.changeLanguage('en');
    });
  });

  it('carries the project name and the mark', async () => {
    await renderScreen(<HomeScreen />);

    const element = screen.getByText(NAME);
    expect(element).toBeTruthy();
    const linteljsElement = screen.getByLabelText('linteljs');
    expect(linteljsElement).toBeTruthy();
  });

  it('names the one command that runs the whole gate', async () => {
    await renderScreen(<HomeScreen />);

    const element = screen.getByText(CHECK);
    expect(element).toBeTruthy();
  });

  it('speaks the language chosen', async () => {
    await renderScreen(<HomeScreen />);

    await act(async () => {
      await i18next.changeLanguage(last);
    });

    const { common } = resources[last];
    const element = screen.getByText(common.homeLedeExpo);
    expect(element).toBeTruthy();
  });

  it('speaks the chosen language in the gate hint', async () => {
    await renderScreen(<HomeScreen />);

    await act(async () => {
      await i18next.changeLanguage(last);
    });

    const { common } = resources[last];
    const hint = common.gateHint
      .replace('<code>{command}</code>', CHECK);
    const element = screen.getByText(hint);
    expect(element).toBeTruthy();
  });

  it('is the one main landmark on the page', async () => {
    await renderScreen(<HomeScreen />);

    const landmarks = screen.container.queryAll((node) => {
      return node.props.role === 'main';
    });
    expect(landmarks).toHaveLength(1);
  });
});
