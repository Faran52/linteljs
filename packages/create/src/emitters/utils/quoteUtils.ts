// `String.raw` keeps a backslash literal, but cannot carry a backtick, `${` or a trailing backslash.
const RAW_UNSAFE = /(?:`|\$\{|\\$)/u;

export const quote = (value: string): string => {
  if (value.includes('\\') && !RAW_UNSAFE.test(value)) {
    return `String.raw\`${value}\``;
  }

  const escaped = value
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r');

  return `'${escaped}'`;
};
