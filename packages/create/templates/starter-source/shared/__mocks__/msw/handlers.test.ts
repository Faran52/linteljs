import {
  describe,
  expect,
  it,
} from 'vitest';

interface VersionResponse {
  readonly status: string;
}

/*
 * Against the running interceptor the setup file starts, and through `fetch` rather than through the adapter: what
 * is asserted here is what the handlers answer, and the adapter has a suite of its own. It also keeps this file
 * free of the adapter's filename, which is `fetchExtended` on nine targets and `fetch-extended` on Angular.
 */
describe('handlers', () => {
  it('answers the version endpoint', async () => {
    const response = await fetch('/api/version');

    expect(response.ok).toBe(true);
    await expect(response.json() as Promise<VersionResponse>).resolves.toEqual({ status: 'ok' });
  });

  // `onUnhandledRequest: 'error'` in the setup file, so a path nobody wrote a handler for fails rather than leaks.
  it('refuses a path no handler answers, rather than reaching the network', async () => {
    await expect(fetch('/api/nothing-here')).rejects.toThrow();
  });
});
