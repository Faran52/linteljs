import { NAME } from '../config/linteljs';
import { createCounter } from '../counter';
import { markSvg } from '../lib/mark';

/*
 * The whole of the popup, which is the whole of this surface: a popup is a panel a few hundred pixels wide that
 * closes when it loses focus, so it carries no nav, no routes and no second page. The extension's other surfaces
 * are its other entries, and the manifest is what names them.
 *
 * Built node by node rather than from one string of markup. Two reasons, and the second is the real one: a
 * reference kept is a reference that cannot be null, where a query back out of `innerHTML` is a guard for a case
 * that cannot happen; and an extension runs under a content security policy that has no reason to trust markup.
 *
 * With a hosted framework this is the file to replace with a component.
 */
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
  // The one piece of markup, and a constant: the mark is an SVG, which is a document rather than a component.
  root.innerHTML = markSvg;
  root.append(title, lede, row, caption);
};
