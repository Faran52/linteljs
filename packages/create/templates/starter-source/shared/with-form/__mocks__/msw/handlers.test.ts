import {
  describe,
  expect,
  it,
} from 'vitest';

interface VersionResponse {
  readonly status: string;
}

interface ContactResponse {
  readonly status: string;
}

const postContact = async (body: object): Promise<Response> => {
  return await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

/*
 * Against the running interceptor the setup file starts, and through `fetch` rather than through the adapter: what
 * is asserted here is what the handlers answer, and the adapter has a suite of its own.
 */
describe('handlers', () => {
  it('answers the version endpoint', async () => {
    const response = await fetch('/api/version');

    await expect(response.json() as Promise<VersionResponse>).resolves.toEqual({ status: 'ok' });
  });

  it('accepts contact details that pass validation', async () => {
    const response = await postContact({ email: 'someone@example.com', message: 'Ten characters at least.' });

    expect(response.status).toBe(202);
    await expect(response.json() as Promise<ContactResponse>).resolves.toEqual({ status: 'accepted' });
  });

  // The server validates too, which is what makes this reachable without going through the form.
  it('refuses contact details that do not, with the status a server would send', async () => {
    const response = await postContact({ email: 'nope', message: 'short' });

    expect(response.status).toBe(422);
  });
});
