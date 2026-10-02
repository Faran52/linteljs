import { type Answers, type Artifact } from '@config/types';

import { localesOf } from '@utils/answerUtils';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';
import { sortedImports } from '../../utils/importUtils';
import { stylingPlugin } from '../../utils/stylingUtils';

import { rollupInputs } from './utils/inputUtils';

// `resolve: { tsconfigPaths: true }` reads the same alias list the ESLint config does.

export const emitViteConfig = (answers: Answers): string | null => {
  const record = targetFor(answers);
  const {
    vitePlugin: framework,
    viteInputs,
    i18n,
  } = record;

  if (framework === undefined) {
    return null;
  }

  const compiler = localesOf(answers).length === 0 ? undefined : i18n?.compiler?.vitePlugin;
  const vitePlugin = {
    imports: [...framework.imports, ...compiler?.imports ?? []],
    calls: [...framework.calls, ...compiler?.calls ?? []],
  };

  const styling = stylingPlugin(answers.styling);
  const imports = sortedImports([
    "import { defineConfig } from 'vite';",
    ...vitePlugin.imports,
    ...styling.imports,
  ], record.framework);

  // StyleX first, as its documentation asks: after the framework plugin it breaks Fast Refresh.
  const stylingCalls = styling.call === undefined ? [] : [styling.call];
  const calls = answers.styling === 'stylex'
    ? [...stylingCalls, ...vitePlugin.calls]
    : [...vitePlugin.calls, ...stylingCalls];

  // One per line: React's compiler call plus tailwind is 128 characters, over the emitted `max-len`.
  const plugins = calls
    .map((call) => {
      return `    ${call},\n`;
    })
    .join('');

  const inputs = rollupInputs(viteInputs);
  const declarations = styling.declarations.length === 0 ? '' : `${styling.declarations.join('\n')}\n\n`;

  return `${imports}

${declarations}export default defineConfig({
  plugins: [
${plugins}  ],
${inputs}  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
});
`;
};

// Birth only: a real project outgrows this config within its first feature.
export const viteConfigEmitter = (answers: Answers): Artifact[] => {
  const config = emitViteConfig(answers);

  return config === null
    ? []
    : [{
        ...emitted('standard', 'vite.config.ts', config),
        preserve: true,
      }];
};
