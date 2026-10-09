// Development only, and never during SSR: React Router's `root.tsx` also renders on the server, which has no service worker.
export const startMocks = async (): Promise<void> => {
  if (!import.meta.env.DEV || import.meta.env.SSR) {
    return;
  }

  const { worker } = await import('./msw/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
};
