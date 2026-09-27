import { NAME } from '../config/linteljs';
import { createCounter } from '../counter';
import { markSvg } from '../lib/mark';

// Built node by node: a kept reference cannot be null, and an extension's CSP has no reason to trust markup.
export const renderPopup = (root: HTMLElement): void => {
  const title = document.createElement('h1');
  const lede = document.createElement('p');
  const count = document.createElement('span');
  const button = document.createElement('button');
  const row = document.createElement('div');
  const caption = document.createElement('p');

  title.className = 'title';
  title.textContent = NAME;
  lede.className = 'lede';
  lede.textContent = 'An extension, built by Vite and the standard already applied.';

  count.className = 'count';
  count.setAttribute('aria-live', 'polite');
  button.className = 'button';
  button.type = 'button';
  button.textContent = 'Add one';
  row.className = 'counter';
  row.append(count, button);

  caption.className = 'caption';
  caption.textContent = 'Held while the popup is open; a popup closes and forgets.';

  const counter = createCounter((next) => {
    count.textContent = String(next);
  });

  button.addEventListener('click', counter.add);

  root.className = 'hero';
  root.innerHTML = markSvg;
  root.append(title, lede, row, caption);
};
