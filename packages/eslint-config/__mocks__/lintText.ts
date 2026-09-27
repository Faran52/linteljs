import { join } from 'node:path';

import { ESLint, type Linter } from 'eslint';

import type { Layer } from '../src/types';

// ESLint types the method `any`, so the shape is declared here.
interface CalculatedConfig {
  rules: Partial<Linter.RulesRecord>;
}

interface ConfigReader {
  calculateConfigForFile: (filePath: string) => Promise<CalculatedConfig>;
}

// `projectService: true` needs the file inside a real tsconfig; `fixtures/sfc/` carries one.
export const SFC_FIXTURES = join(import.meta.dirname, 'fixtures/sfc');

// On disk for the same reason.
export const JSX_FIXTURE = join(import.meta.dirname, 'fixtures/jsx/Widget.tsx');

export const ownBlockNames = (layer: Layer): string[] => {
  return layer
    .flatMap(({ name }) => {
      return name?.startsWith('@linteljs/') ? [name] : [];
    });
};

export const startsWith = (prefix: string) => {
  return (ruleId: string | null): boolean => {
    return ruleId?.startsWith(prefix) ?? false;
  };
};

// The only way to tell a rule that is off from one that is on and silent.
export const ruleNamesFor = async (config: Layer, filePath: string): Promise<string[]> => {
  const reader: ConfigReader = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
  });
  const calculated = await reader.calculateConfigForFile(filePath);

  return Object.keys(calculated.rules);
};

// One turned off is still a key in the same map.
export const enabledRuleIdsFor = async (config: Layer, filePath: string): Promise<string[]> => {
  const reader: ConfigReader = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
  });
  const calculated = await reader.calculateConfigForFile(filePath);

  return Object.entries(calculated.rules)
    .filter(([, entry]) => {
      const severity = Array.isArray(entry) ? entry[0] : entry;

      return severity !== 'off' && severity !== 0;
    })
    .map(([ruleId]) => {
      return ruleId;
    });
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

  return result.messages
    .map((message) => {
      return message.ruleId;
    });
};

// A parse error has no rule id, and it is the evidence a layer order broke the parser.
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

  return messages
    .map((message) => {
      return message.ruleId;
    });
};

export const sortsAheadOfPackages = async (config: Layer, specifier: string): Promise<boolean> => {
  const code = `import { a } from '${specifier}';\n\nimport { b } from 'zod';\n\nexport const value = [a, b];\n`;
  const ruleIds = await ruleIdsFor(config, code, 'src/lib/utils/sample.ts');

  return !ruleIds.includes('simple-import-sort/imports');
};
