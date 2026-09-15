import { type Answers, hasLibrary } from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

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

  const tailwind = hasLibrary(answers, 'tailwind');
  const tanstackRouter = answers.router === 'tanstack-router';

  const imports = [
    "import { defineConfig } from 'vite';",
    ...(tanstackRouter ? ["import { tanstackRouter } from '@tanstack/router-plugin/vite';"] : []),
    ...vitePlugin.imports,
    ...(tailwind ? ["import tailwindcss from '@tailwindcss/vite';"] : []),
  ].join('\n');

  // The router plugin rewrites route files before the framework plugin transforms them.
  const calls = [
    ...(tanstackRouter ? ["tanstackRouter({ target: 'react', autoCodeSplitting: true })"] : []),
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
