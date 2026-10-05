import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { DataProvider } from './DataProvider';

describe('DataProvider', () => {
  it('renders what sits under it', async () => {
    await render(
      <DataProvider>
        <Text>under the data layer</Text>
      </DataProvider>,
    );

    const element = screen.getByText('under the data layer');
    expect(element).toBeTruthy();
  });
});
