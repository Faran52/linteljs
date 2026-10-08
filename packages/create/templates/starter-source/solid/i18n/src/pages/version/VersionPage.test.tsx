import { render, screen } from '@solidjs/testing-library';

import { ANSWERS, STACK } from '@config/linteljs';

import { languages, resources } from '@i18n/config';
import { applyLanguage } from '@i18n/i18n';

import { VersionPage } from './VersionPage';

const last = languages.at(-1)?.id ?? 'en';

describe('VersionPage', () => {
  const open = (): void => {
    render(() => {
      return <VersionPage />;
    });
  };

  afterEach(() => {
    applyLanguage('en');
  });

  it('renders every recorded row of the stack', () => {
    open();

    for (const { name, version } of STACK) {
      const elements = screen.getAllByText(name);
      expect(elements).not.toHaveLength(0);
      const versionElements = screen.getAllByText(version);
      expect(versionElements).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from, labelled in the language chosen', () => {
    open();
    applyLanguage(last);

    const { common } = resources[last];

    for (const { label } of ANSWERS) {
      const elements = screen.getAllByText(common[label]);
      expect(elements).not.toHaveLength(0);
    }
  });
});
