// StyleX injects its dev CSS into `index.html`, which Nuxt does not have. Vite serves under `/_nuxt/`, the CSS at root.
export const STYLEX_DEV_HEAD: readonly string[] = [
  '  $development: {',
  '    app: {',
  '      head: {',
  '        script: [{',
  "          type: 'module',",
  "          src: '/_nuxt/@id/virtual:stylex:runtime',",
  '        }],',
  '        link: [{',
  "          rel: 'stylesheet',",
  "          href: '/virtual:stylex.css',",
  '        }],',
  '      },',
  '    },',
  '  },',
];
