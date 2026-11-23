import {
  changeLanguage,
  mountIsland,
  serverCase,
  testing,
} from './hostedFramework';

const COPY = {
  en: { contactSend: 'Send' },
  ar: { contactSend: 'أرسل' },
};

const switchTo = (language: string): void => {
  changeLanguage(language);
};

const renderIsland = (): void => {
  mountIsland(COPY);
};

describe('ContactIsland', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  it('renders the language on the page once mounted', () => {
    switchTo('ar');
    renderIsland();

    const button = testing.screen.getByRole('button', { name: 'أرسل' });

    expect(button).toBeTruthy();
  });

  serverCase(COPY, switchTo);

  it('renders again when the switcher changes the language', async () => {
    renderIsland();
    switchTo('ar');

    const button = await testing.screen.findByRole('button', { name: 'أرسل' });

    expect(button).toBeTruthy();
  });

  it('shows the key a language has no word for', () => {
    switchTo('ja');
    renderIsland();

    const button = testing.screen.getByRole('button', { name: 'contactSend' });

    expect(button).toBeTruthy();
  });
});
