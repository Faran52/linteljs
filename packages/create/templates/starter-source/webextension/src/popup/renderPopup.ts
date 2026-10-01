import { CHECK, NAME } from '@config/linteljs';

import { markSvg } from '@lib/mark/mark';

// Built node by node: a kept reference cannot be null, and an extension's CSP has no reason to trust markup.
export const renderPopup = (root: HTMLElement): void => {
  const title = document.createElement('h1');
  const lede = document.createElement('p');
  const hint = document.createElement('p');
  const command = document.createElement('code');

  title.className = 'title';
  title.textContent = NAME;
  lede.className = 'lede';
  lede.textContent = 'An extension, built by Vite and the standard already applied.';

  command.textContent = CHECK;
  hint.className = 'hint';
  hint.append('Run ', command, ' for the full gate.');

  root.className = 'hero';
  root.innerHTML = markSvg;
  root.append(title, lede, hint);
};
