import { createRouter, createWebHistory } from 'vue-router';

import { STATUSES } from '@config/statuses';

import StatusPage from '@features/status-page/StatusPage.vue';

import { ROUTES } from '../views/routes';

export const router = createRouter({
  // A project served from a sub-path passes its base here.
  history: createWebHistory(),
  routes: [
    ...ROUTES
      .map(({
        id,
        path,
        component,
      }) => {
        return {
          name: id,
          path,
          component,
        };
      }),
    // Last, and outside the route list, so the header never links it.
    {
      path: '/:pathMatch(.*)*',
      component: StatusPage,
      props: STATUSES.notFound,
    },
  ],
});
