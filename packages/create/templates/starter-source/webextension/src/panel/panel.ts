// A main landmark and one heading, as the popup has.
export const renderPanel = (root: HTMLElement): void => {
  const main = document.createElement('main');
  const label = document.createElement('p');
  const title = document.createElement('h1');
  const status = document.createElement('p');

  label.className = 'starter-label';
  label.textContent = 'LintelJS Starter';
  main.className = 'hero';
  title.className = 'title';
  status.className = 'lede';
  title.textContent = 'Panel';
  status.textContent = 'Ready.';
  main.append(label, title, status);
  root.append(main);
};
