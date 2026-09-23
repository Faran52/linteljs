import { render, screen } from '@testing-library/react';

import { Mark } from './Mark';

describe('Mark', () => {
  it('is an image with a name, since it carries meaning rather than decoration', () => {
    render(<Mark />);

    expect(screen.getByRole('img', { name: 'linteljs' })).toBeTruthy();
  });

  /*
   * The beam is the fixed one, so only the three lines below it are styled at all. Asserted on which paths carry
   * a class rather than on the name of one: under StyleX the name is a compiled atomic class, and a suite that
   * spelled `.mark-line` would be testing the styling answer instead of the markup.
   */
  it('styles the lines and never the beam', () => {
    const { container } = render(<Mark />);
    const paths = [...container.querySelectorAll('path')];

    expect(paths).toHaveLength(4);
    expect(paths.filter((path) => {
      return path.hasAttribute('class');
    })).toHaveLength(3);
  });
});
