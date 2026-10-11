import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { StoreProvider } from './StoreProvider';

describe('StoreProvider', () => {
  it('renders what sits under it', async () => {
    await render(
      <StoreProvider>
        <Text>under the store</Text>
      </StoreProvider>,
    );

    const element = screen.getByText('under the store');
    expect(element).toBeTruthy();
  });
});
