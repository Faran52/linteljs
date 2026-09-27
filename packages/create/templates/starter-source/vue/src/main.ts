import { createApp } from 'vue';

import App from './App.vue';
import { installData } from './lib/providers/installData';
import { installStore } from './lib/providers/installStore';
import { router } from './router';

import './styles/main.css';

const app = createApp(App);

installStore(app);
installData(app);
app
  .use(router)
  .mount('#root');
