import { render } from 'solid-js/web';

import { App } from './App';
import { DataProvider } from './lib/providers/DataProvider';
import { StoreProvider } from './lib/providers/StoreProvider';

import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Element #root not found');
}

/*
 * One entry, whatever was answered. The store lives in one provider and the data layer in the other, so an answer
 * changes one file rather than multiplying this one.
 */
render(() => {
  return (
    <StoreProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </StoreProvider>
  );
}, root);
