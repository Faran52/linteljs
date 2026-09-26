import { type Artifact } from '@config/types';

import { type Answers, type HostedFramework } from '@answers';
import { OUTSIDE_TESTS, targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';
import { stylingPlugin } from '../../utils/stylingUtils';

// Astro's Vite options live here, so there is no `vite.config.ts`. `.mjs` is the name `astro check` looks for first.

interface Integration {
  specifier: string;
  call: string;
}

const INTEGRATIONS: Record<HostedFramework, Integration> = {
  // The React Compiler, passed through to `@vitejs/plugin-react`; the guard keeps its memo cache out of coverage.
  react: {
    specifier: '@astrojs/react',
    call: `react({ compiler: ${OUTSIDE_TESTS} })`,
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

export const emitAstroConfig = (answers: Answers): string | null => {
  if (targetFor(answers).astro !== true) {
    return null;
  }

  const framework = answers.hostedFramework;
  const styling = stylingPlugin(answers.styling, 'js');

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

export default defineConfig({
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
