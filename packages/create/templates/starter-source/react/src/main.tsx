import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { DataProvider } from './lib/providers/DataProvider';
import { StoreProvider } from './lib/providers/StoreProvider';

import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Element #root not found');
}

/*
 * One entry, whatever was answered. The router lives in `App`, the store in one provider and the data layer in the
 * other, so an answer changes one file rather than multiplying this one by three.
 */
createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </StoreProvider>
  </StrictMode>,
);
