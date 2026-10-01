import { createApp } from 'vue';

import App from './App.vue';
import {
  applyLanguage,
  detectLanguage,
  i18n,
} from './i18n';
import { dataProvider } from './lib/providers/data/dataProvider';
import { storeProvider } from './lib/providers/store/storeProvider';
import { router } from './router';

import './styles/main.css';

const app = createApp(App);

// Before the mount, so the first paint is already in the reader's language and direction.
applyLanguage(detectLanguage());
storeProvider(app);
dataProvider(app);

app
  .use(i18n)
  .use(router)
  .mount('#root');
