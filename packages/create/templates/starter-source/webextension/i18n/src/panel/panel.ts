import {
  detectLanguage,
  directionOf,
  t,
} from '@i18n/i18n';

// A main landmark and one heading, as the popup has, in the language the popup stored.
export const renderPanel = (root: HTMLElement): void => {
  const language = detectLanguage();
  const main = document.createElement('main');
  const title = document.createElement('h1');
  const status = document.createElement('p');

  document.documentElement.lang = language;
  document.documentElement.dir = directionOf(language);
  title.textContent = t('panel', language);
  status.textContent = t('panelReady', language);
  main.append(title, status);
  root.append(main);
};
