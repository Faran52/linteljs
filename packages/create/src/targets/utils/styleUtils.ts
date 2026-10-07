import { hasForm } from './gateUtils';

import type { Answers } from '@config/types';
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

interface WrittenComponent {
  readonly key: keyof ComponentPaths;
  readonly path: string;
  readonly ships: (answers: Answers) => boolean;
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
  ['button', always],
  ['textInput', hasForm],
];

const at = (target: string, asset: string): AssetPath => {
  const assetPath: AssetPath = target === asset ? {} : { source: asset };

  return assetPath;
};

// A target leaves out a component it never writes, so no stylesheet ships without its reader.
const writtenOf = (paths: Partial<ComponentPaths>): WrittenComponent[] => {
  return COMPONENTS
    .flatMap(([key, ships]): WrittenComponent[] => {
      const path = paths[key];

      if (path === undefined) {
        return [];
      }

      const written: WrittenComponent[] = [{
        key,
        path,
        ships,
      }];

      return written;
    });
};

// Ships with its component: an entry importing a file never written fails the build with ENOENT.
export const componentStyles = (paths: Partial<ComponentPaths> = COMPONENT_PATHS): StarterFile[] => {
  return writtenOf(paths)
    .map(({
      key,
      path,
      ships,
    }): StarterFile => {
      const target = `${path}.css`;

      const file: StarterFile = {
        target,
        when: (answers) => {
          return ships(answers) && !isStylex(answers);
        },
        shared: true,
        ...at(target, `${COMPONENT_PATHS[key]}.css`),
      };

      return file;
    });
};

// `ui/app-mark/AppMark` to `ui/app-mark/appMarkStyles.ts`.
const stylesOf = (path: string): string => {
  const stemStart = path.lastIndexOf('/') + 1;
  const upper = path.charAt(stemStart);
  const initial = upper.toLowerCase();

  return `${path.slice(0, stemStart)}${initial}${path.slice(stemStart + 1)}Styles.ts`;
};

// Ships with its component, since a module nothing imports fails the coverage gate.
export const componentStyleModules = (
  from?: 'react' | 'solid',
  paths: Partial<ComponentPaths> = COMPONENT_PATHS,
): StarterFile[] => {
  const shared = from === undefined ? {} : { shared: from };
  // Solid's tree spreads `class`, which `attrs` writes from React's sheet where `props` writes `className`.
  const sheet: Pick<StarterFile, 'shared' | 'stylexAttrs'> = from === 'solid'
    ? {
        shared: 'react',
        stylexAttrs: true,
      }
    : shared;

  const tokens: StarterFile = {
    // One asset: all four modules read these tokens and no framework touches them.
    target: 'src/styles/tokens.stylex.ts',
    when: isStylex,
    variant: 'stylex',
    shared: true,
  };

  return writtenOf(paths)
    .flatMap(({
      key,
      path,
      ships,
    }): StarterFile[] => {
      const target = stylesOf(path);
      const asset = at(target, stylesOf(COMPONENT_PATHS[key]));

      const variants: StarterFile[] = [
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
          ...sheet,
          ...asset,
        },
      ];

      return variants;
    })
    .concat(tokens);
};

// StyleX injects its dev CSS into `index.html`, so a server-rendered document links it itself.
export const stylexDocument = (target: string): StarterFile[] => {
  const documents: StarterFile[] = [
    {
      target,
      when: (answers) => {
        return !isStylex(answers);
      },
    },
    {
      target,
      when: isStylex,
      variant: 'stylex',
    },
  ];

  return documents;
};

export const tailwindThemeFile = (): StarterFile => {
  const file: StarterFile = {
    target: 'src/styles/theme.css',
    when: (answers) => {
      return answers.styling === 'tailwind';
    },
    variant: 'tailwind',
    shared: true,
  };

  return file;
};
