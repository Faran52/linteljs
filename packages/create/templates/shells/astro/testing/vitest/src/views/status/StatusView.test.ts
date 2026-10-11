// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

import { STATUSES } from '@config/statuses';

import StatusView from './StatusView.astro';

const statuses = Object.values(STATUSES);

describe('StatusView', () => {
  it.each(statuses)('shows $code with a way home', async (status) => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(StatusView, { props: status });

    expect(html).toContain(String(status.code));
    expect(html).toContain('class="status-action" href="/"');
  });

  it('announces the line under the code', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(StatusView, { props: STATUSES.notFound });
    const [alert] = /role="alert"[^>]*>[^<]*/u.exec(html) ?? [''];

    expect(alert).toContain(STATUSES.notFound.message);
  });
});
