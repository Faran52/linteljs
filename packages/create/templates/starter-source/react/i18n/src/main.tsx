import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { applyDocumentDirection, initI18n } from './i18n';
import { DataProvider } from './lib/providers/data/DataProvider';
import { StoreProvider } from './lib/providers/store/StoreProvider';

import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Element #root not found');
}

// Before the first render, so the first paint is already in the reader's language and direction.
applyDocumentDirection(initI18n().language);

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </StoreProvider>
  </StrictMode>,
);
