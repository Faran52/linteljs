import { join } from 'node:path';

import { ESLint } from 'eslint';

import type { Linter } from 'eslint';
import type { Layer } from '../src/types';

// Both single-file-component layers set `projectService: true`, so their files must exist
// inside a real tsconfig; `fixtures/sfc/` carries one that includes `.vue` and `.svelte`.
export const SFC_FIXTURES = join(import.meta.dirname, 'fixtures/sfc');

// A real `.tsx` on disk, for the same reason: `projectService` cannot type a path that is only a string.
export const JSX_FIXTURE = join(import.meta.dirname, 'fixtures/jsx/Widget.tsx');

// Reads as the assertion it appears in: `ruleIds.some(startsWith('vue/'))`.
export const startsWith = (prefix: string) => {
  return (ruleId: string | null): boolean => {
    return ruleId?.startsWith(prefix) ?? false;
  };
};

// Lints a source string against a layer, returning its rule ids. `overrideConfigFile: true` stops ESLint
// walking up to this workspace's `eslint.config.ts`, so the layer is tested as the whole config a consumer gets.
export const ruleIdsFor = async (config: Layer, code: string, filePath: string): Promise<(string | null)[]> => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
  });
  const [result] = await eslint.lintText(code, { filePath });

  if (!result) {
    throw new Error(`ESLint returned no result for ${filePath}`);
  }

  return result.messages.map((message) => {
    return message.ruleId;
  });
};

/**
 * Every message for a file that must exist on disk (a cycle needs both halves resolvable; an
 * SFC needs a real file for its project service). Messages, not rule ids: a parse error carries
 * no rule id, only a `fatal` message, the only evidence a layer order broke the top-level parser.
 */
export const messagesForFile = async (config: Layer, filePath: string): Promise<Linter.LintMessage[]> => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
  });
  const [result] = await eslint.lintFiles([filePath]);

  if (!result) {
    throw new Error(`ESLint returned no result for ${filePath}`);
  }

  return result.messages;
};

// The same, reduced to rule ids.
export const ruleIdsForFile = async (config: Layer, filePath: string): Promise<(string | null)[]> => {
  const messages = await messagesForFile(config, filePath);

  return messages.map((message) => {
    return message.ruleId;
  });
};
