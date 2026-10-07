import { dev } from '$app/env';

if (dev) {
  import('@mocks/msw/browser')
    .then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: 'bypass' });
    })
    .catch((err: unknown) => {
      console.error(err);
    });
}
