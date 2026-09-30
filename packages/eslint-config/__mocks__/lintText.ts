import {
  copyFile,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
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

// Next's link rule reads its routes from `settings.next.rootDir`, and the workspace root has no `app/`.
export const NEXT_PROJECT: Layer = [
  {
    name: 'test/next-project',
    settings: { next: { rootDir: join(import.meta.dirname, 'fixtures/next') } },
  },
];

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

export const fixedTextFor = async (config: Layer, code: string, filePath: string): Promise<string> => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
    fix: true,
  });
  const [result] = await eslint.lintText(code, { filePath });

  if (!result) {
    throw new Error(`ESLint returned no result for ${filePath}`);
  }

  return result.output ?? code;
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

// On disk beside a tsconfig because `projectService` reads the file; outside `__mocks__/` so no glob exempts it.
export const ruleIdsForSfc = async (config: Layer, code: string, fileName: string): Promise<(string | null)[]> => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'linteljs-sfc-')));

  try {
    await copyFile(join(SFC_FIXTURES, 'tsconfig.json'), join(root, 'tsconfig.json'));
    await writeFile(join(root, fileName), code);

    const eslint = new ESLint({
      cwd: root,
      overrideConfigFile: true,
      overrideConfig: config,
    });
    const [result] = await eslint.lintFiles([fileName]);

    if (!result) {
      throw new Error(`ESLint returned no result for ${fileName}`);
    }

    return result.messages
      .map((message) => {
        return message.ruleId;
      });
  }
  finally {
    await rm(root, {
      recursive: true,
      force: true,
    });
  }
};

// `count` lines of code, one statement each, so `max-lines` counts exactly `count`.
export const codeLines = (count: number, indent = ''): string => {
  return Array.from({ length: count }, (_, index) => {
    return `${indent}console.warn(${String(index)});\n`;
  })
    .join('');
};

// An arrow function spanning exactly `lines` lines, its head and closing brace included.
export const functionOf = (lines: number): string => {
  return `export const run = () => {\n${codeLines(lines - 2, '  ')}};\n`;
};

export const sortsAheadOfPackages = async (config: Layer, specifier: string): Promise<boolean> => {
  const code = `import { a } from '${specifier}';\n\nimport { b } from 'zod';\n\nexport const value = [a, b];\n`;
  const ruleIds = await ruleIdsFor(config, code, 'src/lib/utils/sample.ts');

  return !ruleIds.includes('simple-import-sort/imports');
};
