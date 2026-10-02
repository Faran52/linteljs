import { render, screen } from '@testing-library/react';

import Version from './version';

describe('Version route', () => {
  it('renders the version page', () => {
    render(<Version />);

    const element = screen.getByRole('heading', {
      level: 1,
      name: 'Version',
    });
    expect(element).toBeTruthy();
  });
});
