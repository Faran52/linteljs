import { render, screen } from '@testing-library/react';

import { ANSWERS, STACK } from '@config/linteljs';

import { VersionPage } from './VersionPage';

describe('VersionPage', () => {
  it('renders every recorded row of the stack', () => {
    render(<VersionPage />);

    for (const { name, version } of STACK) {
      const elements = screen.getAllByText(name);
      expect(elements).not.toHaveLength(0);
      const versionElements = screen.getAllByText(version);
      expect(versionElements).not.toHaveLength(0);
    }
  });

  it('renders every answer this project was generated from', () => {
    render(<VersionPage />);

    for (const { label } of ANSWERS) {
      const element = screen.getByText(label);
      expect(element).toBeTruthy();
    }
  });
});
