import 'expo-router/entry';

// Hermes lacks two globals msw reads at import, so they go first.
if (__DEV__) {
  import('@mocks/msw/polyfills')
    .then(async () => {
      const { server } = await import('@mocks/msw/native');
      server.listen({ onUnhandledRequest: 'bypass' });
    })
    .catch((err: unknown) => {
      console.error(err);
    });
}
