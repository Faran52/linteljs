import {
  describe,
  expect,
  it,
} from 'vitest';

interface VersionResponse {
  readonly status: string;
}

describe('handlers', () => {
  it('answers the version endpoint', async () => {
    const response = await fetch('/api/version');

    expect(response.ok).toBe(true);
    await expect(response.json() as Promise<VersionResponse>).resolves.toEqual({ status: 'ok' });
  });

  it('refuses a path no handler answers, rather than reaching the network', async () => {
    await expect(fetch('/api/nothing-here')).rejects.toThrow();
  });
});
