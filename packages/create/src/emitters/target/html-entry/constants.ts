export interface Icon {
  type: string;
  href: string;
}

export const FAVICON: Icon = {
  type: 'image/svg+xml',
  href: '/favicon.svg',
};

// One of the PNGs the manifest names: an extension has no `favicon.svg`.
export const EXTENSION_ICON: Icon = {
  type: 'image/png',
  href: '/icons/icon-32.png',
};
