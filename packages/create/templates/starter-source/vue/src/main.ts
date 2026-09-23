import { createApp } from 'vue';

import App from './App.vue';
import { installData } from './lib/providers/installData';
import { installStore } from './lib/providers/installStore';
import { router } from './router';

import './styles/main.css';

/*
 * One entry, whatever was answered. The store and the data layer each install themselves through one function, so
 * an answer changes that file rather than multiplying this one.
 */
const app = createApp(App);

installStore(app);
installData(app);
app.use(router).mount('#app');
