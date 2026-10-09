export const VITE_SCRIPTS: Record<string, string> = {
  dev: 'vite',
  build: 'vite build',
  preview: 'vite preview',
};

export const IGNORES = ['dist/**', 'coverage/**'];

// React Router's CLI owns the build and the document, and only `react()` runs the compiler.
export const FRAMEWORK_MODE_LEAVES = 'oxc-transform-react';
