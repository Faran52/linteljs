import { render, screen } from '@testing-library/react';

import { Mark } from './Mark';

describe('Mark', () => {
  it('is an image with a name, since it carries meaning rather than decoration', () => {
    render(<Mark />);

    expect(screen.getByRole('img', { name: 'linteljs' })).toBeTruthy();
  });

  it('styles the lines and never the beam', () => {
    const { container } = render(<Mark />);
    const paths = [...container.querySelectorAll('path')];

    expect(paths).toHaveLength(4);
    const lines = paths
      .filter((path) => {
        return path.hasAttribute('class');
      });

    expect(lines).toHaveLength(3);
  });
});
