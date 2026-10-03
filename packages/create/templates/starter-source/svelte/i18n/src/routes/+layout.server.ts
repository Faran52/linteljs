import type { Language } from '@i18n';
import type { ServerLoad } from '@sveltejs/kit';

interface LayoutData {
  language: Language;
}

interface LayoutInput {
  locals: App.Locals;
}

// Hands every page the language `hooks.server.ts` detected, so the render and hydration agree.
export const load = (({ locals }: LayoutInput): LayoutData => {
  const data: LayoutData = { language: locals.language };

  return data;
}) satisfies ServerLoad;
