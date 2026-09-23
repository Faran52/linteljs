import { renderPopup } from './popup/renderPopup';

import './style.css';

// The popup's entry, named by the manifest. `#app` is the one element `index.html` carries.
const root = document.querySelector<HTMLDivElement>('#app');

if (root !== null) {
  renderPopup(root);
}
