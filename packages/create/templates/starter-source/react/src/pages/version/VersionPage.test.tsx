import { render, screen } from '@testing-library/react';

import { ANSWERS, STACK } from '../../config/linteljs';

import { VersionPage } from './VersionPage';

describe('VersionPage', () => {
  it('renders every recorded row of the stack', () => {
    render(<VersionPage />);

    for (const { name, version } of STACK) {
      expect(screen.getAllByText(name)).not.toHaveLength(0);
      expect(screen.getAllByText(version)).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from', () => {
    render(<VersionPage />);

    for (const { label } of ANSWERS) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
});
