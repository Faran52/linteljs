export const ALWAYS: readonly string[] = [
  'next.config.ts',
  'src/app/layout.tsx',
  'src/app/about/page.tsx',
  'src/app/version/page.tsx',
  'src/components/features/app-header/AppHeader.tsx',
];

export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

export const FROM_REACT: readonly string[] = [
  'src/components/ui/mark/Mark.tsx',
  'src/lib/apis/contact/index.ts',
  'src/components/ui/text-input/TextInput.tsx',
];

export { REACT_ACCESSORS as ACCESSORS } from '../react/constants';
