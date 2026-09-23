/*
 * A beam, and three lines that come into line with it. The beam never moves: it is the standard, and the lines are
 * the files. Markup rather than a component, because a popup with no framework has nowhere to put one; the drift
 * each line travels lives in the stylesheet either way.
 *
 * Under `lib/` rather than `components/`, because it is neither: with no hosted framework a file in `components/`
 * is PascalCase and a component by directory, and with one it is camelCase and a component by extension. A string
 * of markup is not a component under either rule.
 */
export const markSvg = `<svg
  class="mark"
  viewBox="0 0 120 120"
  fill="none"
  stroke="currentColor"
  stroke-linecap="round"
  role="img"
  aria-label="linteljs"
>
  <path d="M12 28 H108" stroke-width="13" />
  <path class="mark-line mark-line-1" d="M12 58 H86" stroke-width="9" />
  <path class="mark-line mark-line-2" d="M12 79 H104" stroke-width="9" />
  <path class="mark-line mark-line-3" d="M12 100 H68" stroke-width="9" />
</svg>`;
