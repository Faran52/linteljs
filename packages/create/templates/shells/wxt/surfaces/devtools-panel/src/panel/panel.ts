import {
  detectLanguage,
  directionOf,
  t,
} from '@i18n/i18n';
import { applyStyles } from '@lib/utils/elementUtils';

import { styles } from './panel.styles';

// Also the DevTools tab's title.
export const panelTitle = (): string => {
  const language = detectLanguage();

  return t('panel', language);
};

// A main landmark and one heading, as the popup has, in the language the popup stored.
export const renderPanel = (root: HTMLElement): void => {
  const language = detectLanguage();
  const main = document.createElement('main');
  const label = document.createElement('p');
  const title = document.createElement('h1');
  const status = document.createElement('p');

  document.documentElement.lang = language;
  document.documentElement.dir = directionOf(language);
  applyStyles(label, styles.starterLabel);
  label.textContent = t('starterLabel', language);
  applyStyles(main, styles.hero);
  applyStyles(title, styles.title);
  applyStyles(status, styles.lede);
  title.textContent = panelTitle();
  status.textContent = t('panelReady', language);
  main.append(label, title, status);
  root.append(main);
};
