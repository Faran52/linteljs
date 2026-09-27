import { renderPopup } from './popup/renderPopup';

import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (root !== null) {
  renderPopup(root);
}
