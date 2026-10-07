import { CHECK, NAME } from '@config/linteljs';

import { markSvg } from '@lib/mark/mark';
import { languages } from '@i18n/config';
import {
  chooseLanguage,
  detectLanguage,
  directionOf,
  type Language,
  partsOf,
  t,
} from '@i18n/i18n';

// The odd parts of a message sit inside `<code>`.
const nodeOf = (part: string, index: number): Node => {
  if (index % 2 === 0) {
    return document.createTextNode(part);
  }

  const code = document.createElement('code');

  code.textContent = part;

  return code;
};

// Built node by node: a kept reference cannot be null, and an extension's CSP has no reason to trust markup.
export const renderPopup = (root: HTMLElement): void => {
  const main = document.createElement('main');
  const title = document.createElement('h1');
  const lede = document.createElement('p');
  const hint = document.createElement('p');
  const picker = document.createElement('select');

  const paint = (language: Language): void => {
    document.documentElement.lang = language;
    document.documentElement.dir = directionOf(language);
    lede.textContent = t('popupLede', language);

    const gate = t('gateHint', language, { command: CHECK });
    const gateNodes = partsOf(gate)
      .map(nodeOf);

    hint.replaceChildren(...gateNodes);

    picker.value = language;
    picker.setAttribute('aria-label', t('language', language));
  };

  title.className = 'title';
  title.textContent = NAME;
  lede.className = 'lede';
  hint.className = 'hint';

  picker.append(...languages
    .map((option) => {
      const item = document.createElement('option');

      item.value = option.id;
      item.lang = option.id;
      item.textContent = option.label;

      return item;
    }));

  picker
    .addEventListener('change', () => {
      chooseLanguage(picker.value);
      paint(detectLanguage());
    });

  main.className = 'hero';
  main.innerHTML = markSvg;
  main.append(title, lede, hint, picker);
  root.append(main);
  paint(detectLanguage());
};
