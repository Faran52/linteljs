// In each hook: under Nuxt, a module this file imports as it loads is not the instance a suite imports, so a
// suite's `server.use` would reach a server nothing listens on.

// `onUnhandledRequest: 'error'`: a request with no handler is a test reaching the network.
beforeAll(async () => {
  const { server } = await import('./msw/node');

  server.listen({ onUnhandledRequest: 'error' });
});

// Between tests, so a handler one test overrode does not leak into the next.
afterEach(async () => {
  const { server } = await import('./msw/node');

  server.resetHandlers();
});

afterAll(async () => {
  const { server } = await import('./msw/node');

  server.close();
});
