/**
 * TanStack Query test defaults, appended when the `tanstack-query` answer was chosen. Not a mock: a query library
 * stubbed out leaves the component under test with nothing to test. Build one client per test with it, in the provider
 * wrapper the render call passes.
 */

// Retries off: a failing query otherwise backs off three times and the test times out instead of asserting.
export const TEST_QUERY_OPTIONS = {
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
};
