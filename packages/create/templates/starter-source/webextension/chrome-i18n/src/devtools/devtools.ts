import { panelTitle } from '../panel/panel';

// The title is fixed at creation, so a language chosen later shows on the next DevTools open.
const title = panelTitle();

void chrome.devtools.panels.create(title, '', 'panel.html');
