import { detectLanguage, directionOf } from '@i18n';
import { acceptedTags } from '@i18n/utils/cookieUtils';

import type { Handle, ResolveOptions } from '@sveltejs/kit/hooks';

// What the hook reads of SvelteKit's event, so a suite can hand it a plain request.
interface LanguageEvent {
  request: Request;
  locals: Partial<App.Locals>;
}

// Generic, so SvelteKit's own event passes back through `resolve` unchanged.
interface LanguageHandleInput<Event extends LanguageEvent> {
  event: Event;
  resolve: (event: Event, options: ResolveOptions) => Response | Promise<Response>;
}

// The reader's language from the request, on `<html>` for the first byte and in `locals` for the root layout.
export const handle = (<Event extends LanguageEvent>({
  event,
  resolve,
}: LanguageHandleInput<Event>): Response | Promise<Response> => {
  const { headers } = event.request;
  const cookies = headers.get('cookie') ?? '';
  const preferred = acceptedTags(headers.get('accept-language') ?? '');
  const language = detectLanguage(cookies, preferred);
  const root = `<html lang="${language}" dir="${directionOf(language)}">`;

  event.locals.language = language;

  return resolve(event, {
    transformPageChunk: ({ html }) => {
      return html.replace('<html lang="en">', root);
    },
  });
}) satisfies Handle;
