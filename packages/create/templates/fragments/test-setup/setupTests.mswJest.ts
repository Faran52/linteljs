// React Native has no `localStorage`; Node 26's warns when msw's cookie store reads it without `--localstorage-file`.
Reflect.deleteProperty(globalThis, 'localStorage');

const { server } = jest.requireActual<typeof import('./msw/node')>('./msw/node');

// `onUnhandledRequest: 'error'`: a request with no handler is a test reaching the network.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Between tests, so a handler one test overrode does not leak into the next.
afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
