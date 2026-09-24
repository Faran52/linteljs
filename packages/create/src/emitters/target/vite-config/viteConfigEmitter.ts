import { type Artifact } from '@config/types';

import { type Answers } from '@answers';
import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';
import { sortedImports } from '../../utils/importUtils';

// For the five Vite targets. `resolve: { tsconfigPaths: true }` reads the same alias list the ESLint config does.

export const emitViteConfig = (answers: Answers): string | null => {
  // Read off the record, so a host composes both plugins without this emitter knowing which.
  const {
    vite,
    vitePlugin,
    viteInputs,
  } = targetFor(answers);

  if (!vite) {
    return null;
  }

  const tailwind = answers.styling === 'tailwind';
  const stylex = answers.styling === 'stylex';

  const imports = sortedImports([
    "import { defineConfig } from 'vite';",
    ...vitePlugin.imports,
    ...(tailwind ? ["import tailwindcss from '@tailwindcss/vite';"] : []),
    /*
     * The raw factory through `unplugin`, not `@stylexjs/unplugin/vite`. Every pre-built factory that package
     * ships is typed `=> any`, so the shorter import puts an `any` in `plugins` and the project fails its own
     * lint; `unpluginFactory` is the one export it types properly.
     */
    ...(stylex
      ? [
          "import { unpluginFactory as stylex } from '@stylexjs/unplugin';",
          "import { createUnplugin } from 'unplugin';",
        ]
      : []),
  ]);

  const calls = [
    /*
     * StyleX first, which is what its own documentation asks for: placed after the framework plugin it breaks
     * Fast Refresh. `useCSSLayers` is its documented default for new projects and is what keeps the generated
     * atomic rules from outranking a hand-written one by specificity alone.
     */
    ...(stylex ? ['createUnplugin(stylex).vite({ useCSSLayers: true })'] : []),
    ...vitePlugin.calls,
    ...(tailwind ? ['tailwindcss()'] : []),
  ];

  // One entry per line: React's compiler call plus tailwind joined is 128 characters, over the emitted `max-len`.
  const plugins = calls.map((call) => {
    return `    ${call},\n`;
  }).join('');

  // crx reads its inputs from the manifest; this is for the one page a manifest cannot name, the devtools panel.
  const entries = Object.entries(viteInputs ?? {}).map(([name, page]) => {
    return `${name}: '${page}'`;
  }).join(', ');

  // In the project's own style: `JSON.stringify`'s double quotes and quoted keys are two lint findings.
  const inputs = viteInputs === undefined
    ? ''
    : `  build: { rollupOptions: { input: { ${entries} } } },\n`;

  return `${imports}

export default defineConfig({
  plugins: [
${plugins}  ],
${inputs}  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
});
`;
};

// Birth only: a real project outgrows this config within its first feature and re-emitting flattens that. A target
// with no vite config answers nothing, so the assembler holds no branch about it.
export const viteConfigEmitter = (answers: Answers): Artifact[] => {
  const config = emitViteConfig(answers);

  return config === null
    ? []
    : [{
        ...emitted('standard', 'vite.config.ts', config),
        preserve: true,
      }];
};
