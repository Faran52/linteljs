import {
  type Answers,
  type Artifact,
  type Framework,
  type Styling,
} from '@config/types';

import { localesOf } from '@utils/answerUtils';

import { type PluginSpec, targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';
import { sortedImports } from '../../utils/importUtils';
import { stylingPlugin } from '../../utils/stylingUtils';

import { rollupInputs } from './utils/inputUtils';

interface ViteParts {
  plugin: PluginSpec;
  styling: Styling | undefined;
  framework: Framework | undefined;
  inputs?: Record<string, string> | undefined;
  serveMocks: boolean;
  wsPort: boolean;
}

// `resolve: { tsconfigPaths: true }` reads the same alias list the ESLint config does.
const viteConfigSource = (parts: ViteParts): string => {
  const { plugin } = parts;
  const styling = stylingPlugin(parts.styling);
  const imports = sortedImports([
    "import { defineConfig } from 'vite';",
    ...plugin.imports,
    ...styling.imports,
  ], parts.framework);

  // StyleX first, as its documentation asks: after the framework plugin it breaks Fast Refresh.
  const stylingCalls = styling.call === undefined ? [] : [styling.call];
  const calls = parts.styling === 'stylex'
    ? [...stylingCalls, ...plugin.calls]
    : [...plugin.calls, ...stylingCalls];

  // One per line: React's compiler call plus tailwind is 128 characters, over the emitted `max-len`.
  const plugins = calls
    .map((call) => {
      return `    ${call},\n`;
    })
    .join('');

  const inputs = rollupInputs(parts.inputs);
  const fs = parts.serveMocks ? ", fs: { allow: ['__mocks__'] }" : '';
  const ws = parts.wsPort ? ', ws: { port: 3000 }' : '';
  const declarations = styling.declarations.length === 0 ? '' : `${styling.declarations.join('\n')}\n\n`;

  return `${imports}

${declarations}export default defineConfig({
  plugins: [
${plugins}  ],
${inputs}  resolve: { tsconfigPaths: true },
  server: { port: 3000${ws}${fs} },
});
`;
};

export const emitViteConfig = (answers: Answers): string | null => {
  const record = targetFor(answers);
  const {
    vitePlugin: framework,
    i18n,
  } = record;

  if (framework === undefined) {
    return null;
  }

  const compiler = localesOf(answers).length === 0 ? undefined : i18n?.compiler?.vitePlugin;
  const source = viteConfigSource({
    plugin: {
      imports: [...framework.imports, ...compiler?.imports ?? []],
      calls: [...framework.calls, ...compiler?.calls ?? []],
    },
    styling: answers.styling,
    framework: record.framework,
    inputs: record.viteInputs,
    serveMocks: record.serveMocks === true && answers.mocking === 'msw',
    wsPort: record.wsPort === true,
  });

  return source;
};

// Birth only: a real project outgrows this config within its first feature.
export const viteConfigEmitter = (answers: Answers): Artifact[] => {
  const config = emitViteConfig(answers);

  if (config === null) {
    return [];
  }

  const artifacts: Artifact[] = [{
    ...emitted('standard', 'vite.config.ts', config),
    preserve: true,
  }];

  return artifacts;
};
