import { createRouter, createWebHistory } from 'vue-router';

import { ROUTES } from '../views/routes';

/*
 * One route per page, read off the one list the header reads. A page is added there and appears in both, so
 * neither can disagree about which pages this project has.
 */
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
