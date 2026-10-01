import { NAME } from '@config/linteljs';

import { HomePage } from '../pages/home/HomePage';

import type { ReactNode } from 'react';

const Home = (): ReactNode => {
  return <HomePage name={NAME} />;
};

export default Home;
