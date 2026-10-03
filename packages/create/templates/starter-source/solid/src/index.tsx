import { render } from 'solid-js/web';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';

import { App } from './App';

import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Element #root not found');
}

render(() => {
  return (
    <StoreProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </StoreProvider>
  );
}, root);
