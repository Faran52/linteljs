import { createApp } from 'vue';

import App from './App.vue';
import { dataProvider } from './lib/providers/data/dataProvider';
import { storeProvider } from './lib/providers/store/storeProvider';
import { router } from './router';

import './styles/main.css';

const app = createApp(App);

storeProvider(app);
dataProvider(app);

app
  .use(router)
  .mount('#root');
