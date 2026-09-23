<!--
  A beam, and three lines that come into line with it. The beam never moves: it is the standard, and the lines are
  the files. Pure SVG, so every framework receives the same markup rather than its own animation, and the drift
  each line travels lives beside the component rather than in a style attribute.
-->
<script lang="ts">
  import { styles } from './styles';
</script>

<svg
  {...styles.mark}
  viewBox="0 0 120 120"
  fill="none"
  stroke="currentColor"
  stroke-linecap="round"
  role="img"
  aria-label="linteljs"
>
  <path d="M12 28 H108" stroke-width="13" />
  <path {...styles.line1} d="M12 58 H86" stroke-width="9" />
  <path {...styles.line2} d="M12 79 H104" stroke-width="9" />
  <path {...styles.line3} d="M12 100 H68" stroke-width="9" />
</svg>
