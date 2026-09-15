import { join } from 'node:path';

import { ESLint } from 'eslint';

import type { Linter } from 'eslint';
import type { Layer } from '../src/types';

// `projectService: true` needs the file inside a real tsconfig; `fixtures/sfc/` carries one.
export const SFC_FIXTURES = join(import.meta.dirname, 'fixtures/sfc');

// On disk for the same reason.
export const JSX_FIXTURE = join(import.meta.dirname, 'fixtures/jsx/Widget.tsx');

export const startsWith = (prefix: string) => {
  return (ruleId: string | null): boolean => {
    return ruleId?.startsWith(prefix) ?? false;
  };
};

// `overrideConfigFile: true` keeps this workspace's own `eslint.config.ts` out of the run.
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

// Messages, not rule ids: a parse error has no rule id, and that is the evidence a layer order broke the parser.
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

export const ruleIdsForFile = async (config: Layer, filePath: string): Promise<(string | null)[]> => {
  const messages = await messagesForFile(config, filePath);

  return messages.map((message) => {
    return message.ruleId;
  });
};
