import { type Artifact, type Emitter } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

/**
 * The Angular CLI's own project file, which is the build, the dev server and the test target in one. Written
 * rather than copied because it is keyed by the project's name: every `buildTarget` names it, so a template with a
 * placeholder in it would be a placeholder in four places.
 *
 * The build reads the starter's `tsconfig.app.json`, which extends the one tsconfig this CLI emits and narrows the
 * build to `src/main.ts`, away from the specs.
 */
export const emitAngularConfig = (name: string, packageManager: string): string => {
  const config = {
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    cli: { packageManager },
    newProjectRoot: 'projects',
    projects: {
      [name]: {
        projectType: 'application',
        schematics: {},
        root: '',
        sourceRoot: 'src',
        prefix: 'app',
        architect: {
          build: {
            builder: '@angular/build:application',
            options: {
              browser: 'src/main.ts',
              tsConfig: 'tsconfig.app.json',
              index: 'src/index.html',
              assets: [{
                glob: '**/*',
                input: 'public',
              }],
              styles: ['src/styles.css'],
            },
            configurations: {
              production: {
                budgets: [
                  {
                    type: 'initial',
                    maximumWarning: '500kB',
                    maximumError: '1MB',
                  },
                  {
                    type: 'anyComponentStyle',
                    maximumWarning: '4kB',
                    maximumError: '8kB',
                  },
                ],
                outputHashing: 'all',
              },
              development: {
                optimization: false,
                extractLicenses: false,
                sourceMap: true,
              },
            },
            defaultConfiguration: 'production',
          },
          serve: {
            builder: '@angular/build:dev-server',
            configurations: {
              production: { buildTarget: `${name}:build:production` },
              development: { buildTarget: `${name}:build:development` },
            },
            defaultConfiguration: 'development',
          },
          test: { builder: '@angular/build:unit-test' },
        },
      },
    },
  };

  return `${JSON.stringify(config, null, 2)}\n`;
};

// Birth only: a project's build configuration is its own from its first run, and `sync` has no name to key it by.
export const angularConfigEmitter: Emitter = (answers, _project, name): Artifact[] => {
  const { angularProject } = targetFor(answers);

  return angularProject === true
    ? [emitted('standard', 'angular.json', emitAngularConfig(name, answers.packageManager))]
    : [];
};
