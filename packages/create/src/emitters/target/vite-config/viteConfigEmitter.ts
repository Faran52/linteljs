import { type Answers, type Artifact } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';
import { sortedImports } from '../../utils/importUtils';
import { stylingPlugin } from '../../utils/stylingUtils';

// `resolve: { tsconfigPaths: true }` reads the same alias list the ESLint config does.

export const emitViteConfig = (answers: Answers): string | null => {
  const { vitePlugin, viteInputs } = targetFor(answers);

  if (vitePlugin === undefined) {
    return null;
  }

  const styling = stylingPlugin(answers.styling);
  const imports = sortedImports(["import { defineConfig } from 'vite';", ...vitePlugin.imports, ...styling.imports]);

  // StyleX first, as its documentation asks: after the framework plugin it breaks Fast Refresh.
  const calls = answers.styling === 'stylex'
    ? [...styling.calls, ...vitePlugin.calls]
    : [...vitePlugin.calls, ...styling.calls];

  // One per line: React's compiler call plus tailwind is 128 characters, over the emitted `max-len`.
  const plugins = calls
    .map((call) => {
      return `    ${call},\n`;
    })
    .join('');

  // crx reads its inputs from the manifest, which cannot name the devtools panel.
  const entries = Object.entries(viteInputs ?? {})
    .map(([name, page]) => {
      return `${name}: '${page}'`;
    })
    .join(', ');

  // `JSON.stringify`'s double quotes and quoted keys are two lint findings.
  const inputs = viteInputs === undefined
    ? ''
    : `  build: { rollupOptions: { input: { ${entries} } } },\n`;

  const declarations = styling.declarations
    .map((line) => {
      return `${line}\n\n`;
    })
    .join('');

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
