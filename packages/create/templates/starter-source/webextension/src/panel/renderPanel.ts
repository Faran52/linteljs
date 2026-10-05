// A main landmark and one heading, as the popup has.
export const renderPanel = (root: HTMLElement): void => {
  const main = document.createElement('main');
  const title = document.createElement('h1');
  const status = document.createElement('p');

  title.textContent = 'Panel';
  status.textContent = 'Ready.';
  main.append(title, status);
  root.append(main);
};
