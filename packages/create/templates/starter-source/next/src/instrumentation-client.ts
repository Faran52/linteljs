if (process.env.NODE_ENV === 'development') {
  import('@mocks/msw/browser')
    .then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: 'bypass' });
    })
    .catch((err: unknown) => {
      console.error(err);
    });
}
