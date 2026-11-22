import { t } from '@i18n/i18n';

import {
  expectSent,
  fillField,
  headingCase,
  mountPage,
  retypeEmail,
  testing,
} from './hostedFramework';

import type { ContactCopyKey } from './utils/contactCopyUtils';

const inEnglish = (key: ContactCopyKey): string => {
  return t(key);
};

const renderPage = (): void => {
  mountPage(inEnglish);
};

const fill = (label: string, value: string): void => {
  fillField(label, value);
};

describe('ContactPage', () => {
  it('refuses what the rules refuse, and says why beside the field', async () => {
    renderPage();
    fill('Email', 'not-an-address');

    const element = await testing.screen.findByText('Enter a valid email address.');
    expect(element).toBeTruthy();
  });

  it('flags only the field that was left', async () => {
    renderPage();
    fill('Email', 'not-an-address');
    await testing.screen.findByText('Enter a valid email address.');

    const untouched = testing.screen.queryByText('Write a message of at least ten characters.');

    expect(untouched).toBeNull();
  });

  it('clears an error as soon as the value is valid', async () => {
    renderPage();
    fill('Email', 'not-an-address');
    await testing.screen.findByText('Enter a valid email address.');
    retypeEmail();

    await testing.waitFor(() => {
      const stale = testing.screen.queryByText('Enter a valid email address.');

      expect(stale).toBeNull();
    });
  });

  it('lets a send name the field still missing', async () => {
    renderPage();
    fill('Email', 'someone@example.com');
    testing.events.click(testing.screen.getByRole('button', { name: 'Send' }));

    const element = await testing.screen.findByText('Write a message of at least ten characters.');
    expect(element).toBeTruthy();
  });

  headingCase(renderPage);

  it('sends once both fields are valid', async () => {
    renderPage();
    fill('Email', 'someone@example.com');
    fill('Message', 'Ten characters, at least.');
    testing.events.click(testing.screen.getByRole('button', { name: 'Send' }));

    await expectSent();
  });
});
