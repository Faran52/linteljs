import type { Answers } from '#answers/registry';
import type { TargetId } from '#answers/target/target/targetAnswer';
import type { StarterFile } from '../types';

/*
 * Where each styled component sits, as its directory and its own base name, because a stylesheet and a style
 * module are both named for the component they sit beside. Vue refuses a single-word component name, so its mark
 * and its button are `AppMark` and `AppButton` under directories named for those.
 */
export interface ComponentPaths {
  readonly header: string;
  readonly mark: string;
  readonly button: string;
  readonly textInput: string;
}

interface AssetPath {
  readonly source?: string;
}

// StyleX compiles a component's styles at build time, so under it a component's stylesheet does not ship.
export const isStylex = (answers: Answers): boolean => {
  return answers.styling === 'stylex';
};

export const COMPONENT_PATHS: ComponentPaths = {
  header: 'src/components/features/app-header/AppHeader',
  mark: 'src/components/ui/mark/Mark',
  button: 'src/components/ui/button/Button',
  textInput: 'src/components/ui/text-input/TextInput',
};

const hasControls = (answers: Answers): boolean => {
  return answers.store !== undefined || answers.form !== undefined;
};

const hasForm = (answers: Answers): boolean => {
  return answers.form !== undefined;
};

const always = (): boolean => {
  return true;
};

// One row per styled component: which key it is, and the answers under which the component ships at all.
const COMPONENTS: readonly (readonly [keyof ComponentPaths, (answers: Answers) => boolean])[] = [
  ['header', always],
  ['mark', always],
  ['button', hasControls],
  ['textInput', hasForm],
];

// `source` only where the destination is not the asset's own path, which is the renaming targets and no one else.
const at = (target: string, asset: string): AssetPath => {
  return target === asset ? {} : { source: asset };
};

/**
 * The component stylesheets, which `base.css` used to carry against its own stated rule: a page's classes are
 * shared across pages and a component's stylesheet sits beside it. Each ships exactly when its component does, and
 * the style entry imports it under the same condition, because an entry naming a file the answers never wrote
 * fails the build with ENOENT rather than degrading.
 *
 * None of them ships under StyleX, where the same rules are a `styles.ts` beside the component and are compiled to
 * atomic classes instead.
 */
export const componentStyles = (paths: ComponentPaths = COMPONENT_PATHS): StarterFile[] => {
  return COMPONENTS.map(([key, ships]): StarterFile => {
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

/**
 * Every styled component's rules as a module beside it, in two spellings of one export: class names under plain
 * CSS and Tailwind, compiled atomic classes under StyleX. The markup spreads whatever comes back and never spells
 * a class, so a component varies by its own answers and not by those times the styling one.
 *
 * Each ships exactly when its component does, since a module nothing imports is one the coverage gate fails on.
 *
 * `from` names the target whose bytes these are. React writes the `className` spelling that `stylex.props`
 * answers with, and Next and the extension take it; Solid writes the `class` one from `stylex.attrs`, and the
 * SFC targets take that.
 */
export const componentStyleModules = (
  from?: TargetId,
  paths: ComponentPaths = COMPONENT_PATHS,
): StarterFile[] => {
  const shared = from === undefined ? {} : { shared: from };

  const tokens: StarterFile = {
    /*
     * StyleX's names for the tokens, which all four modules read and no framework touches, so it is one asset
     * rather than one per target. Pointed at `tokens.css` rather than given values of its own.
     */
    target: 'src/styles/tokens.stylex.ts',
    when: isStylex,
    variant: 'stylex',
    shared: true,
  };

  return COMPONENTS.flatMap(([key, ships]): StarterFile[] => {
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
  }).concat(tokens);
};
