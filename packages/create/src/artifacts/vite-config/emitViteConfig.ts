import { type Answers, hasLibrary } from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

// For the five Vite targets. `resolve: { tsconfigPaths: true }` reads the same alias list the ESLint config does.

// Everything after `from`, quotes included, so sorting by it is sorting by specifier.
const specifierOf = (line: string): string => {
  return line.replace(/^import .* from /, '');
};

// The order `simple-import-sort` would fix to: packages by specifier, then the project's own files after a blank line.
const sortedImports = (lines: string[]): string => {
  const bySpecifier = (left: string, right: string): number => {
    return specifierOf(left).localeCompare(specifierOf(right), 'en');
  };
  const packages = lines.filter((line) => {
    return !specifierOf(line).startsWith("'.");
  }).sort(bySpecifier);
  const own = lines.filter((line) => {
    return specifierOf(line).startsWith("'.");
  }).sort(bySpecifier);

  return [packages.join('\n'), ...(own.length === 0 ? [] : [own.join('\n')])].join('\n\n');
};

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

  const imports = sortedImports([
    "import { defineConfig } from 'vite';",
    ...(tanstackRouter ? ["import { tanstackRouter } from '@tanstack/router-plugin/vite';"] : []),
    ...vitePlugin.imports,
    ...(tailwind ? ["import tailwindcss from '@tailwindcss/vite';"] : []),
  ]);

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
