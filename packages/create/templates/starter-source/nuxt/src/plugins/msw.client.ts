import { defineNuxtPlugin } from 'nuxt/app';

export default defineNuxtPlugin(async () => {
  if (!import.meta.dev) {
    return;
  }

  try {
    const { worker } = await import('@mocks/msw/browser');

    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  catch (err) {
    console.error(err);
  }
});
