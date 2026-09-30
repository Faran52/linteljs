import { createRouter, createWebHistory } from 'vue-router';

import { ROUTES } from '../views/routes';

export const router = createRouter({
  // A project served from a sub-path passes its base here.
  history: createWebHistory(),
  routes: ROUTES
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
});
