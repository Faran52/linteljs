import { hasForm, pressable } from './gateUtils';

import type { Answers, TargetId } from '@config/types';
import type { StarterFile } from '../types';

// Vue refuses a single-word component name, so its mark and button are `AppMark` and `AppButton`.
export interface ComponentPaths {
  readonly header: string;
  readonly mark: string;
  readonly button: string;
  readonly textInput: string;
}

interface AssetPath {
  readonly source?: string;
}

const isStylex = (answers: Answers): boolean => {
  return answers.styling === 'stylex';
};

const COMPONENT_PATHS: ComponentPaths = {
  header: 'src/components/features/app-header/AppHeader',
  mark: 'src/components/ui/mark/Mark',
  button: 'src/components/ui/button/Button',
  textInput: 'src/components/ui/text-input/TextInput',
};

const always = (): boolean => {
  return true;
};

const COMPONENTS: readonly (readonly [keyof ComponentPaths, (answers: Answers) => boolean])[] = [
  ['header', always],
  ['mark', always],
  ['button', pressable],
  ['textInput', hasForm],
];

const at = (target: string, asset: string): AssetPath => {
  return target === asset ? {} : { source: asset };
};

// Ships with its component: an entry importing a file never written fails the build with ENOENT.
export const componentStyles = (paths: ComponentPaths = COMPONENT_PATHS): StarterFile[] => {
  return COMPONENTS
    .map(([key, ships]): StarterFile => {
      const target = `${paths[key]}.css`;

      return {
        target,
        when: (answers) => {
          return ships(answers) && !isStylex(answers);
        },
        shared: true,
        ...at(target, `${COMPONENT_PATHS[key]}.css`),
      };
    });
};

const directoryOf = (path: string): string => {
  return path.slice(0, path.lastIndexOf('/'));
};

// Ships with its component, since a module nothing imports fails the coverage gate.
export const componentStyleModules = (
  from?: TargetId,
  paths: ComponentPaths = COMPONENT_PATHS,
): StarterFile[] => {
  const shared = from === undefined ? {} : { shared: from };

  const tokens: StarterFile = {
    // One asset: all four modules read these tokens and no framework touches them.
    target: 'src/styles/tokens.stylex.ts',
    when: isStylex,
    variant: 'stylex',
    shared: true,
  };

  return COMPONENTS
    .flatMap(([key, ships]): StarterFile[] => {
      const target = `${directoryOf(paths[key])}/styles.ts`;
      const asset = at(target, `${directoryOf(COMPONENT_PATHS[key])}/styles.ts`);

      return [
        {
          target,
          when: (answers) => {
            return ships(answers) && !isStylex(answers);
          },
          ...shared,
          ...asset,
        },
        {
          target,
          when: (answers) => {
            return ships(answers) && isStylex(answers);
          },
          variant: 'stylex',
          ...shared,
          ...asset,
        },
      ];
    })
    .concat(tokens);
};
