import { render } from 'solid-js/web';

import { DataProvider } from '@lib/providers/data/DataProvider';
import { StoreProvider } from '@lib/providers/store/StoreProvider';
import { applyLanguage, detectLanguage } from '@i18n/i18n';

import { App } from './App';

import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Element #root not found');
}

// Before the first render, so the first paint is already in the reader's language and direction.
applyLanguage(detectLanguage());

render(() => {
  return (
    <StoreProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </StoreProvider>
  );
}, root);
