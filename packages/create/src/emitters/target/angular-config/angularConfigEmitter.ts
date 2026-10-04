import { type Artifact, type Emitter } from '@config/types';

import { unscopedName } from '@utils/nameUtils';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

// Written rather than copied: every `buildTarget` is keyed by the project's name.
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
              // Straight into `dist/`, where `vite preview` serves from.
              outputPath: {
                base: 'dist',
                browser: '',
              },
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

// Birth only: the build configuration is the project's, and `sync` has no name to key it by.
export const angularConfigEmitter: Emitter = (answers, _project, name): Artifact[] => {
  const { angularProject } = targetFor(answers);

  if (angularProject !== true) {
    return [];
  }

  const config = emitAngularConfig(unscopedName(name), answers.packageManager);
  const artifacts = [emitted('standard', 'angular.json', config)];

  return artifacts;
};
