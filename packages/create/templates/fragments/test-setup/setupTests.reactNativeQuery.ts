// The app's client keeps a finished mutation for five minutes, and Jest waits on that timer before it exits.
beforeAll(() => {
  const { queryClient } = jest.requireActual<typeof import('@lib/providers/data/DataProvider')>(
    '@lib/providers/data/DataProvider',
  );

  queryClient.setDefaultOptions({
    queries: { gcTime: Infinity },
    mutations: { gcTime: Infinity },
  });
});
