import { render, screen } from '@solidjs/testing-library';

import { Mark } from './Mark';

describe('Mark', () => {
  it('is an image with a name, since it carries meaning rather than decoration', () => {
    render(() => {
      return <Mark />;
    });

    const element = screen.getByRole('img', { name: 'linteljs' });
    expect(element).toBeTruthy();
  });

  it('styles the lines and never the beam', () => {
    const { container } = render(() => {
      return <Mark />;
    });
    const paths = [...container.querySelectorAll('path')];

    expect(paths).toHaveLength(4);
    const lines = paths
      .filter((path) => {
        return path.hasAttribute('class');
      });

    expect(lines).toHaveLength(3);
  });
});
