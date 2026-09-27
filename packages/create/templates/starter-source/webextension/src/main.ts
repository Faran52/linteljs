import { renderPopup } from './popup/renderPopup';

import './style.css';

const root = document.querySelector<HTMLDivElement>('#root');

if (root !== null) {
  renderPopup(root);
}
