import { createRouter, createWebHistory } from 'vue-router';

import { ROUTES } from '../views/routes';

export const router = createRouter({
  // No base: a project served from a sub-path passes one, and a starter is served from the root.
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
