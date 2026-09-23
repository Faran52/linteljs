/*
 * The mark's styles as props. Three lines rather than one indexed helper: the markup spells all three anyway, and
 * a lookup by index would answer `undefined` under `noUncheckedIndexedAccess` for a value that cannot be missing.
 */
export const styles = {
  mark: { className: 'mark' },
  line1: { className: 'mark-line mark-line-1' },
  line2: { className: 'mark-line mark-line-2' },
  line3: { className: 'mark-line mark-line-3' },
};
