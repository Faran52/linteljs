import { mount, type VueWrapper } from '@vue/test-utils';

import HomeView from './HomeView.vue';

export const mountHome = (): VueWrapper => mount(HomeView);

export const storeCases = (): void => {};
