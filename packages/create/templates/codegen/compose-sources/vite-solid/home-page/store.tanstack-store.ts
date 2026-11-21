import { fireEvent, screen } from '@solidjs/testing-library';

export const storeCases = (open: () => void): void => {
  it('counts up when the button it holds is pressed', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add one' }));

    const element = screen.getByText('1');
    expect(element).toBeTruthy();
  });
};
