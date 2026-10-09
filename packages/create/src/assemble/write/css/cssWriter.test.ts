import { expect, it } from 'vitest';

import { cssWriter } from './cssWriter';

it('writes one import per line, in order', () => {
  const text = cssWriter(['tailwindcss', './theme.css']);

  expect(text).toBe("@import 'tailwindcss';\n@import './theme.css';\n");
});
