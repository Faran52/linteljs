import { renderPanel } from './panel';

import '../style.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (root !== null) {
  renderPanel(root);
}
