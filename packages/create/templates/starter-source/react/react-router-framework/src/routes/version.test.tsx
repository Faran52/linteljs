import { render, screen } from '@testing-library/react';

import Version from './version';

describe('Version route', () => {
  it('renders the version page', () => {
    render(<Version />);

    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Version',
    })).toBeTruthy();
  });
});
