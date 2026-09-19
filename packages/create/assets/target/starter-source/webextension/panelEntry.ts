import { renderPanel } from './renderPanel';

const root = document.querySelector<HTMLDivElement>('#app');

if (root !== null) {
  renderPanel(root);
}
