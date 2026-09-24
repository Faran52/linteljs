import Home from './Home.vue';

const register = (component: object): object => {
  return component;
};

export const component = Home;

export const registered = register(Home);
