// @vitest-environment node
import { languages } from '@i18n/config';
import { languageCookie } from '@i18n/utils/cookieUtils';

import { handle } from './hooks.server';

type Served = [string, string | undefined];

const last = languages.at(-1)?.id ?? 'en';
const rtl = languages
  .find(({ dir }) => {
    return dir === 'rtl';
  })?.id ?? 'en';

// The served document, and the language left for the root layout.
const serve = async (headers: Record<string, string>): Promise<Served> => {
  const locals: Partial<App.Locals> = {};
  const event = {
    request: new Request('http://localhost/', { headers }),
    locals,
  };
  const response = await handle({
    event,
    resolve: async (_event, options) => {
      const chunk = await options.transformPageChunk?.({
        html: '<html lang="en"><body></body></html>',
        done: true,
      });

      return new Response(chunk);
    },
  });
  const html = await response.text();
  const served: Served = [html, locals.language];

  return served;
};

describe('the server hook', () => {
  it('serves the stored language before the accepted ones', async () => {
    const [html, language] = await serve({
      'cookie': `theme=dark; ${languageCookie(last)}`,
      'accept-language': 'en',
    });

    expect(html).toContain(`<html lang="${last}"`);
    expect(language).toBe(last);
  });

  it('follows Accept-Language when nothing is stored, with its direction', async () => {
    const [html, language] = await serve({ 'accept-language': `fr;q=0.9, ${rtl}` });

    expect(html).toBe(`<html lang="${rtl}" dir="rtl"><body></body></html>`);
    expect(language).toBe(rtl);
  });

  it('serves English to a request that names nothing', async () => {
    const [html, language] = await serve({});

    expect(html).toBe('<html lang="en" dir="ltr"><body></body></html>');
    expect(language).toBe('en');
  });
});
