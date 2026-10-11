import type { Language } from '@i18n/i18n';

// SvelteKit's own ambient interfaces. See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    // Detected from the request in `hooks.server.ts`.
    interface Locals {
      language: Language;
    }

    // Absent only where no root layout load ran, such as a suite.
    interface PageData {
      language?: Language;
    }
  }
}

export {};
