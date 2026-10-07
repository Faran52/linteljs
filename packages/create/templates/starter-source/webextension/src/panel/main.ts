import { renderPanel } from './panel';

const root = document.querySelector<HTMLDivElement>('#app');

if (root !== null) {
  renderPanel(root);
}
