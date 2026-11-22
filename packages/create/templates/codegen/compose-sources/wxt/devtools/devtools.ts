import { panelTitle } from '../panel/panel';

import { createPanel } from './browser';

// The title is fixed at creation, so a language chosen later shows on the next DevTools open.
const title = panelTitle();

void createPanel(title);
