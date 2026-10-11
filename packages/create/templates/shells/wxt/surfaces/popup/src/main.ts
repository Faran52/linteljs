import { renderPopup } from './popup/popup';

import './style.css';

const root = document.querySelector<HTMLDivElement>('#root');

if (root !== null) {
  renderPopup(root);
}
