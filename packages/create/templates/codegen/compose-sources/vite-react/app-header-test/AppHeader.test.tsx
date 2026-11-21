import { render, screen } from '@testing-library/react';

import { AppHeader } from './AppHeader';
import { routerCases, routerHelpers } from './router';

routerHelpers();

describe('AppHeader', () => {
  routerCases();
});
