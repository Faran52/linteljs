import { type Answers, hasLibrary } from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

// Emits `vite.config.ts` for the five Vite targets; Next, Angular and React Native own their own build. `resolve:
// { tsconfigPaths: true }` resolves the same alias list the ESLint config reads, so nothing is declared twice.

export const emitViteConfig = (answers: Answers): string | null => {
  // Read off the record, so a target that hosts a framework composes both plugins without this emitter knowing which.
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

  // The router plugin goes first: it rewrites route files before the framework plugin transforms them.
  const calls = [
    ...(tanstackRouter ? ["tanstackRouter({ target: 'react', autoCodeSplitting: true })"] : []),
    ...vitePlugin.calls,
    ...(tailwind ? ['tailwindcss()'] : []),
  ];

  /**
   * One entry per line, like the vitest config beside it: React's compiler call plus tailwind joined is 128 characters,
   * over the emitted 120-char `max-len` with no fixer.
   * No empty-list case: every target here contributes at least one call, so `[]` is a branch no answer can produce.
   */
  const plugins = calls.map((call) => {
    return `    ${call},\n`;
  }).join('');

  // Only where a target asks for one. crx reads its inputs out of the manifest, so this exists for the one page a
  // manifest cannot name: a devtools panel, opened at runtime rather than declared.
  const entries = Object.entries(viteInputs ?? {}).map(([name, page]) => {
    return `${name}: '${page}'`;
  }).join(', ');

  // Written in the emitted project's own style rather than through `JSON.stringify`, whose double quotes and quoted
  // keys are two lint findings in the file it lands in.
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
