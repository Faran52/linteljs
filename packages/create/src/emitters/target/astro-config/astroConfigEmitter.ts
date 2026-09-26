import { type Artifact } from '@config/types';

import { type Answers, type HostedFramework } from '@answers';
import { targetFor } from '@targets';
import { OUTSIDE_TESTS } from '@targets/constants';

import { emitted } from '../../utils/artifactUtils';
import { stylingPlugin } from '../../utils/stylingUtils';

// Astro's Vite options live here, so there is no `vite.config.ts`. `.mjs` is the name `astro check` looks for first.
// Null for every other target.

interface Integration {
  specifier: string;
  call: string;
  compiler?: string[];
}

const INTEGRATIONS: Record<HostedFramework, Integration> = {
  // Plain Babel options, not `reactCompilerPreset()`: `@astrojs/react` fails the build on the preset form with
  // `Unknown option: .preset`. The guard keeps the memo cache out of the test run's coverage.
  react: {
    specifier: '@astrojs/react',
    call: 'react(reactCompiler)',
    compiler: [
      '// The React Compiler as plain Babel options through @astrojs/react; a Rolldown preset fails here with',
      '// `Unknown option: .preset`, and without the guard the memo cache leaves a branch uncovered per component.',
      `const reactCompiler = ${OUTSIDE_TESTS}`,
      "  ? { babel: { plugins: ['babel-plugin-react-compiler'] } }",
      '  : {};',
    ],
  },
  vue: {
    specifier: '@astrojs/vue',
    call: 'vue()',
  },
  svelte: {
    specifier: '@astrojs/svelte',
    call: 'svelte()',
  },
  solid: {
    specifier: '@astrojs/solid-js',
    call: 'solid()',
  },
};

const BINDING: Record<HostedFramework, string> = {
  react: 'react',
  vue: 'vue',
  svelte: 'svelte',
  solid: 'solid',
};

// Only React emits anything here.
const compilerPrelude = (framework: HostedFramework | undefined): string => {
  const lines = framework === undefined ? undefined : INTEGRATIONS[framework].compiler;

  return lines === undefined ? '' : `${lines.join('\n')}\n\n`;
};

export const emitAstroConfig = (answers: Answers): string | null => {
  if (targetFor(answers).astro !== true) {
    return null;
  }

  const framework = answers.hostedFramework;
  const styling = stylingPlugin(answers.styling);

  const imports = [
    "import { defineConfig } from 'astro/config';",
    ...(framework === undefined
      ? []
      : [`import ${BINDING[framework]} from '${INTEGRATIONS[framework].specifier}';`]),
    ...styling.imports,
  ].join('\n');

  const integrations = framework === undefined
    ? ''
    : `  integrations: [${INTEGRATIONS[framework].call}],\n`;

  // Vite plugins, not integrations: `@astrojs/tailwind` was for Tailwind 3, and StyleX has never shipped an Astro one.
  const vite = styling.calls.length === 0 ? '' : `  vite: { plugins: [${styling.calls.join(', ')}] },\n`;

  return `${imports}

${compilerPrelude(framework)}export default defineConfig({
${integrations}${vite}});
`;
};

// Birth only, for the same reason `vite.config.ts` is.
export const astroConfigEmitter = (answers: Answers): Artifact[] => {
  const config = emitAstroConfig(answers);

  return config === null
    ? []
    : [{
        ...emitted('standard', 'astro.config.mjs', config),
        preserve: true,
      }];
};
