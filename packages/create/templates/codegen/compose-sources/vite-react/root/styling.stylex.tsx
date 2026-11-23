import { type ReactNode } from 'react';

export const boundaryComment = 'A refused loader and a crash land here, inside the layout; a path no page claims is `routes/not-found.tsx`.';

export const StylingHead = (): ReactNode => {
  return (
    <>
      {/* StyleX injects its dev CSS into `index.html`, which framework mode does not have. */}
      {import.meta.env.DEV
        ? (
            <>
              <script type="module" src="/@id/virtual:stylex:runtime" />
              {/* The runtime disables this link once it injects its own `<style>`, before hydration. */}
              <link
                rel="stylesheet"
                href="/virtual:stylex.css"
                suppressHydrationWarning
              />
            </>
          )
        : null}
    </>
  );
};
