import { NAME } from '../config/linteljs';
import { HomePage } from '../pages/home/HomePage';

import type { ReactNode } from 'react';

// A route module is the page and nothing else: what the route is called lives in `routes.ts`, once.
const Home = (): ReactNode => {
  return <HomePage name={NAME} />;
};

export default Home;
