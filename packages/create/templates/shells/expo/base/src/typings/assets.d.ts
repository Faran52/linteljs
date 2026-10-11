// Metro resolves an image import to an opaque asset id, and nothing in `expo/types` declares one.
declare module '*.png' {
  const asset: number;
  export default asset;
}

declare module '*.jpg' {
  const asset: number;
  export default asset;
}

declare module '*.jpeg' {
  const asset: number;
  export default asset;
}

declare module '*.gif' {
  const asset: number;
  export default asset;
}

declare module '*.webp' {
  const asset: number;
  export default asset;
}

declare module '*.avif' {
  const asset: number;
  export default asset;
}
