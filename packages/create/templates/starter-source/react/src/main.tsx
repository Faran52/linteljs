import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';

import { App } from './App';

import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Element #root not found');
}

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </StoreProvider>
  </StrictMode>,
);
