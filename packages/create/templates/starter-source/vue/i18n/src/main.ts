import { createApp } from 'vue';

import { dataProvider } from '@lib/providers/data/dataProvider';
import { storeProvider } from '@lib/providers/store/storeProvider';
import {
  applyLanguage,
  detectLanguage,
  i18n,
} from '@i18n';

import { router } from '@router/router';

import App from './App.vue';

import '@styles/main.css';

const app = createApp(App);

// Before the mount, so the first paint is already in the reader's language and direction.
applyLanguage(detectLanguage());
storeProvider(app);
dataProvider(app);

app
  .use(i18n)
  .use(router)
  .mount('#root');
