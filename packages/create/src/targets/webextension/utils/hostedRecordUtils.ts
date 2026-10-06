import { DECLARATION_KEY } from '../../constants';
import { hostedNaming } from '../../utils/frameworkUtils';
import { scriptKeys } from '../../utils/namingUtils';
import { type BrowserParts, CRX } from '../constants';

import type { FrameworkParts, TargetRecord } from '../../types';

type HostedRecordParts = Pick<TargetRecord,
  | 'naming'
  | 'vitePlugin'
  | 'tsconfig'
  | 'devDependencies'
  | 'allowBuilds'
  | 'stateRules'
  | 'framework'
  | 'sfcExtension'
  | 'testConditions'
  | 'dependencies'
  | 'testDevDependencies'
>;

const CRX_DEV_DEPENDENCIES = ['@crxjs/vite-plugin', 'vite'];

const bareParts = (browser: BrowserParts): HostedRecordParts => {
  const parts: HostedRecordParts = {
    naming: {
      'src/components/**/!(*.d|*.test|*.spec).ts': 'PASCAL_CASE',
      ...scriptKeys('components'),
      ...DECLARATION_KEY,
    },
    vitePlugin: {
      imports: [...CRX.imports],
      calls: [...CRX.calls],
    },
    tsconfig: { types: browser.types },
    devDependencies: [...CRX_DEV_DEPENDENCIES, ...browser.devDependencies],
    allowBuilds: [],
    stateRules: [],
  };

  return parts;
};

// The parts of the record a hosted framework decides, the bare extension's own where none is hosted.
export const hostedRecordParts = (hosted: FrameworkParts | undefined, browser: BrowserParts): HostedRecordParts => {
  if (hosted === undefined) {
    return bareParts(browser);
  }

  const parts: HostedRecordParts = {
    naming: hostedNaming(hosted.framework),
    framework: hosted.framework,
    ...(hosted.sfcExtension === undefined ? {} : { sfcExtension: hosted.sfcExtension }),
    // `crx` wraps whatever the plugins before it produced.
    vitePlugin: {
      imports: [...hosted.vitePlugin.imports, ...CRX.imports],
      calls: [...hosted.vitePlugin.calls, ...CRX.calls],
    },
    // Without the hosted framework's JSX settings every `.tsx` fails: measured at 213 TS17004 and 245 TS7026.
    tsconfig: {
      types: browser.types,
      ...(hosted.jsx === undefined ? {} : { jsx: hosted.jsx }),
      ...(hosted.jsxImportSource === undefined ? {} : { jsxImportSource: hosted.jsxImportSource }),
    },
    ...(hosted.testConditions === undefined ? {} : { testConditions: hosted.testConditions }),
    dependencies: hosted.dependencies,
    devDependencies: [
      ...CRX_DEV_DEPENDENCIES,
      ...browser.devDependencies,
      ...hosted.devDependencies,
    ],
    testDevDependencies: hosted.testDevDependencies,
    allowBuilds: [...hosted.allowBuilds ?? []],
    stateRules: hosted.stateRules,
  };

  return parts;
};
