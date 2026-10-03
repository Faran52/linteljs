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

// On disk beside its own tsconfig, for `projectService`.
export const JSX_FIXTURE = join(import.meta.dirname, 'fixtures/jsx/Widget.tsx');

export const LEAKED_RENDER_FIXTURE = join(import.meta.dirname, 'fixtures/jsx/Count.tsx');

export const ownBlockNames = (layer: Layer): string[] => {
  return layer
    .flatMap(({ name }) => {
      if (!name?.startsWith('@linteljs/')) {
        return [];
      }

      const own = [name];

      return own;
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

export const ruleEntryFor = async (
  config: Layer,
  filePath: string,
  ruleId: string,
): Promise<Linter.RuleEntry | undefined> => {
  const reader: ConfigReader = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
  });
  const calculated = await reader.calculateConfigForFile(filePath);

  return calculated.rules[ruleId];
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

const FRAMEWORK_RULE_PREFIX
  = /^(?:@stylistic\/jsx-|react|@eslint-react\/|jsx-a11y|vue\/|svelte\/|astro\/|solid\/|@angular-eslint\/)/u;

// `sonarjs/recommended` ships these to every file; a framework turns them back on.
const SONARJS_FRAMEWORK_RULES = new Set([
  'sonarjs/jsx-no-leaked-render',
  'sonarjs/no-hook-setter-in-body',
  'sonarjs/no-useless-react-setstate',
  'sonarjs/no-uniq-key',
  'sonarjs/prefer-read-only-props',
  'sonarjs/no-debounce-throttle-in-render',
  'sonarjs/no-vue-class-component',
  'sonarjs/no-vue-mixins',
  'sonarjs/no-mutate-reactive-state-in-updated-hook',
  'sonarjs/no-angular-bypass-sanitization',
]);

export const frameworkRuleIdsFor = async (config: Layer, filePath: string): Promise<string[]> => {
  const enabled = await enabledRuleIdsFor(config, filePath);

  return enabled
    .filter((ruleId) => {
      const isFrameworkRule = FRAMEWORK_RULE_PREFIX.test(ruleId) || SONARJS_FRAMEWORK_RULES.has(ruleId);

      return isFrameworkRule;
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
  const prefix = join(tmpdir(), 'linteljs-sfc-');
  const directory = await mkdtemp(prefix);
  const root = await realpath(directory);

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
