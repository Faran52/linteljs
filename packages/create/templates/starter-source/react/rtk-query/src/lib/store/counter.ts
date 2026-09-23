import { useDispatch, useSelector } from 'react-redux';

import { configureStore, createSlice } from '@reduxjs/toolkit';

import { baseApi } from '../apis/baseApi';

export interface CounterState {
  count: number;
}

export interface Counter {
  count: number;
  add: () => void;
}

export type RootState = ReturnType<typeof store.getState>;

const counter = createSlice({
  name: 'counter',
  initialState: { count: 0 } satisfies CounterState as CounterState,
  reducers: {
    add: (state) => {
      state.count += 1;
    },
  },
});

/*
 * RTK Query's slice reducer and its middleware both belong on the store: the middleware is what gives an endpoint
 * its cache, its invalidation and its lifecycle. Registering the reducer alone would leave the hooks inert.
 *
 * `baseApi` rather than one api per domain. Every endpoint this project has is injected into that one slice, so
 * this is one reducer and one middleware however many domains appear later, and a tag invalidated anywhere is
 * visible everywhere. It also always exists: a slice that only ships with a form would leave this importing a
 * file the answers never wrote.
 */
export const store = configureStore({
  reducer: {
    counter: counter.reducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(baseApi.middleware);
  },
});

/*
 * The one store this starter ships, and the one place the store answer is visible. Every other file takes
 * `useCounter` and never knows which library is behind it, which is what lets the answer change without the pages
 * changing with it.
 */
export const useCounter = (): Counter => {
  const count = useSelector((state: RootState) => {
    return state.counter.count;
  });
  const dispatch = useDispatch();

  return {
    count,
    add: () => {
      dispatch(counter.actions.add());
    },
  };
};
