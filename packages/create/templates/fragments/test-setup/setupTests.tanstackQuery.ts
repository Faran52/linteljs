// Not a mock: a query library stubbed out leaves the component under test with nothing to test.

// Retries off: a failing query otherwise backs off three times and the test times out instead of asserting.
export const TEST_QUERY_OPTIONS = {
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
};
