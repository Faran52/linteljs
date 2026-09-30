export const ALWAYS: readonly string[] = [
  'next.config.ts',
  'src/app/layout.tsx',
  'src/app/about/page.tsx',
  'src/app/version/page.tsx',
  'src/app/not-found.tsx',
  'src/app/error.tsx',
  'src/app/global-error.tsx',
  'src/components/features/status-page/StatusPage.tsx',
  'src/components/features/app-header/AppHeader.tsx',
];

export const SHARED: readonly string[] = [
  'src/config/standard.ts',
  'src/config/statuses.ts',
  'src/lib/utils/statusUtils.ts',
  'src/styles/tokens.css',
  'src/styles/base.css',
];

export const FROM_REACT: readonly string[] = [
  'src/components/ui/mark/Mark.tsx',
];

export { REACT_ACCESSORS as ACCESSORS } from '../react/constants';
