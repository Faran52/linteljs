import StatusPage from '@features/status-page/StatusPage.vue';

import { ROUTES } from './constants';
import { router } from './router';

describe('router', () => {
  it.each(ROUTES)('names $path for its page', ({ id, path }) => {
    const resolved = router.resolve(path);

    expect(resolved.name).toBe(id);
  });

  it('sends a path nothing matches to the status page', () => {
    const [record] = router.resolve('/nowhere').matched;

    expect(record?.components?.default).toBe(StatusPage);
  });
});
