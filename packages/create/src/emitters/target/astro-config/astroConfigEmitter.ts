import {
  type Answers,
  type Artifact,
  type HostedFramework,
} from '@config/types';

import { OUTSIDE_TESTS, targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';
import { sortedImports } from '../../utils/importUtils';
import { stylingPlugin } from '../../utils/stylingUtils';

interface Integration {
  specifier: string;
  call: string;
}

const INTEGRATIONS: Record<HostedFramework, Integration> = {
  // The guard keeps its memo cache out of coverage.
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

export const emitAstroConfig = (answers: Answers): string | null => {
  if (targetFor(answers).astro !== true) {
    return null;
  }

  const framework = answers.hostedFramework;
  const styling = stylingPlugin(answers.styling, false);

  const imports = sortedImports([
    "import { defineConfig } from 'astro/config';",
    ...(framework === undefined
      ? []
      : [`import ${framework} from '${INTEGRATIONS[framework].specifier}';`]),
    ...styling.imports,
  ]);

  const integrations = framework === undefined
    ? ''
    : `  integrations: [${INTEGRATIONS[framework].call}],\n`;

  // Vite plugins: `@astrojs/tailwind` was for Tailwind 3, and StyleX has never shipped an Astro one.
  const vite = styling.call === undefined ? '' : `  vite: { plugins: [${styling.call}] },\n`;

  const declarations = styling.declarations.length === 0 ? '' : `${styling.declarations.join('\n')}\n\n`;

  return `${imports}

${declarations}export default defineConfig({
${integrations}${vite}});
`;
};

// `.mjs` is the name `astro check` looks for first.
export const astroConfigEmitter = (answers: Answers): Artifact[] => {
  const config = emitAstroConfig(answers);

  return config === null
    ? []
    : [{
        ...emitted('standard', 'astro.config.mjs', config),
        preserve: true,
      }];
};
