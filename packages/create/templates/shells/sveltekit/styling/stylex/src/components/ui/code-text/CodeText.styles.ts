import * as stylex from '@stylexjs/stylex';

import { tokens } from '@styles/tokens.stylex';

const sheet = stylex.create({
  primary: {
    color: tokens.primary,
  },
});

export const styles = {
  primary: stylex.props(sheet.primary),
};
